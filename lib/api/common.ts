import { COMMON_CLIENT_ID } from '@/lib/config';
import { ApiError, call, commonCall } from './client';
import type * as T from './types';

/**
 * Sign-in, the business, its outlets and its team live in costonomy-common-api (shared with Costonomy's other
 * apps); Jobs keeps its own copies under the same ids plus what only hiring needs (Jobs city and locality, type,
 * description). These wrap the two calls each change takes, keeping the shapes the screens already use.
 */

interface CommonTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** The challenge each number was last sent, so the code screen only needs the number. */
const challenges = new Map<string, string>();

export async function sendOtp(mobileNumber: string) {
  const issued = await commonCall<{ challengeId: string; expiresInSeconds: number }>('/v1/auth/otp/send', {
    method: 'POST',
    authenticated: false,
    body: { channel: 'SMS', target: mobileNumber, purpose: 'LOGIN', clientId: COMMON_CLIENT_ID },
  });
  challenges.set(mobileNumber, issued.challengeId);
  return { otpSentTo: mobileNumber, expiresInSeconds: issued.expiresInSeconds };
}

export async function verifyOtp(mobileNumber: string, otp: string, preferredLanguage: string): Promise<T.VerifyOtpResponse> {
  const challengeId = challenges.get(mobileNumber);
  if (!challengeId) throw new ApiError('OTP_EXPIRED', 'That code has expired. Send a new one.', 400);
  const tokens = await commonCall<CommonTokens>('/v1/auth/otp/verify', {
    method: 'POST',
    authenticated: false,
    body: { challengeId, code: otp, clientId: COMMON_CLIENT_ID, preferredLanguage },
  });
  challenges.delete(mobileNumber);
  const me = await call<T.Me>('/users/me', { token: tokens.accessToken });
  return { ...me, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresInSeconds: tokens.expiresIn };
}

export async function refresh(refreshToken: string) {
  const t = await commonCall<CommonTokens>('/v1/auth/refresh', {
    method: 'POST',
    authenticated: false,
    body: { refreshToken, clientId: COMMON_CLIENT_ID },
  });
  return { accessToken: t.accessToken, refreshToken: t.refreshToken, expiresInSeconds: t.expiresIn };
}

export function logout(refreshToken: string) {
  return commonCall<void>('/v1/auth/logout', { method: 'POST', body: { refreshToken } });
}

/** Name and language belong to the account (common); Jobs' copy is updated at once rather than on the webhook. */
export async function updateMe(body: { name?: string; preferredLanguage?: string }): Promise<T.Me> {
  await commonCall('/v1/me', { method: 'PATCH', body });
  return call<T.Me>('/users/me', { method: 'PUT', body });
}

// ── business and outlets ───────────────────────────────────────────────────────

async function cityName(cityId: number): Promise<string | null> {
  const cities = await call<T.City[]>('/cities', { authenticated: false });
  return cities.find((c) => c.id === cityId)?.name ?? null;
}

async function commonOutlet(input: T.OutletInput) {
  return {
    kind: 'OUTLET',
    name: input.name,
    addressLine1: input.address ?? null,
    city: await cityName(input.cityId),
    pincode: input.pincode ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    timezone: 'Asia/Kolkata',
    currency: 'INR',
  };
}

/** Sets an outlet up for hiring in Jobs: Jobs' city and locality, the map pin, and the restaurant's own details. */
function provision(outletId: number, input: T.OutletInput, restaurant?: { restaurantType?: string | null; description?: string | null }) {
  return call<T.Restaurant>(`/common/outlets/${outletId}/provision`, {
    method: 'POST',
    body: {
      cityId: input.cityId,
      localityId: input.localityId ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      restaurantType: restaurant?.restaurantType ?? null,
      description: restaurant?.description ?? null,
    },
  });
}

/** A new business, enrolled in Jobs, with its first outlet; the caller becomes its owner. */
export async function createRestaurant(body: {
  name: string; restaurantType?: string | null; description?: string | null; firstOutlet: T.OutletInput;
}): Promise<T.Restaurant> {
  const org = await commonCall<{ id: number; outlets: { id: number }[] }>('/v1/orgs', {
    method: 'POST',
    body: { orgType: 'RESTAURANT', displayName: body.name, enrollApps: ['JOBS'], firstOutlet: await commonOutlet(body.firstOutlet) },
  });
  return provision(org.outlets[0]!.id, body.firstOutlet, body);
}

export async function updateRestaurant(id: number, body: { name: string; restaurantType?: string | null; description?: string | null }) {
  await commonCall(`/v1/orgs/${id}`, { method: 'PATCH', body: { displayName: body.name } });
  return call<T.Restaurant>(`/restaurants/${id}`, { method: 'PUT', body });
}

export async function addOutlet(restaurantId: number, body: T.OutletInput): Promise<T.Outlet | undefined> {
  const outlet = await commonCall<{ id: number }>(`/v1/orgs/${restaurantId}/outlets`, {
    method: 'POST',
    body: await commonOutlet(body),
  });
  await provision(outlet.id, body);
  return (await call<T.Outlet[]>(`/restaurants/${restaurantId}/outlets`)).find((o) => o.id === outlet.id);
}

export async function updateOutlet(outletId: number, body: T.OutletInput) {
  const { kind: _kind, timezone: _tz, currency: _cur, ...shared } = await commonOutlet(body);
  await commonCall(`/v1/outlets/${outletId}`, { method: 'PATCH', body: shared });
  return call<T.Outlet>(`/outlets/${outletId}`, { method: 'PUT', body });
}

// ── team ─────────────────────────────────────────────────────────────────────

interface Grant {
  roleId: number;
  roleCode?: string | null;
  app?: string;
  scopeType: 'ORG' | 'OUTLET';
  scopeId: number | null;
}

interface CommonMember {
  membershipId: number;
  userId: number;
  name: string | null;
  phone: string | null;
  status: string;
  grants: Grant[];
}

interface CommonInvitation {
  id: number;
  target: string;
  inviteeName: string | null;
  status: string;
  grants: Grant[];
}

interface CommonRole {
  id: number;
  code: string | null;
  permissions: string[];
}

const JOBS_ROLES: T.RestaurantRole[] = ['OWNER', 'ADMIN', 'HR_RECRUITER', 'OUTLET_MANAGER'];

function asTeamMember(id: number, userId: number, name: string | null, phone: string, status: string, grants: Grant[],
                      pending: boolean): T.TeamMember | null {
  const jobs = grants.filter((g) => g.app === 'JOBS' && JOBS_ROLES.includes(g.roleCode as T.RestaurantRole));
  if (jobs.length === 0) return null;
  const role = JOBS_ROLES.find((r) => jobs.some((g) => g.roleCode === r))!;
  const allOutlets = jobs.some((g) => g.scopeType === 'ORG');
  return {
    restaurantUserId: id,
    userId,
    name,
    mobileNumber: phone,
    role,
    status,
    outletIds: allOutlets ? [] : jobs.map((g) => g.scopeId!).filter((x) => x != null),
    allOutlets,
    pendingFirstSignIn: pending,
  };
}

/**
 * The hiring team: members with a Jobs role, then invitations not yet accepted (a number that hasn't signed in
 * yet). An invitation's id is negated, so the screens can tell the two apart without a new field.
 */
export async function team(restaurantId: number): Promise<T.TeamMember[]> {
  const [members, invitations] = await Promise.all([
    commonCall<{ items: CommonMember[] }>(`/v1/orgs/${restaurantId}/members`),
    commonCall<{ items: CommonInvitation[] }>(`/v1/orgs/${restaurantId}/invitations`).catch(() => ({ items: [] })),
  ]);
  const list: T.TeamMember[] = [];
  for (const m of members.items ?? []) {
    const t = asTeamMember(m.membershipId, m.userId, m.name, m.phone ?? '', m.status, m.grants, false);
    if (t) list.push(t);
  }
  for (const i of (invitations.items ?? []).filter((x) => x.status === 'PENDING')) {
    const t = asTeamMember(-i.id, 0, i.inviteeName, i.target, 'INVITED', i.grants, true);
    if (t) list.push(t);
  }
  return list;
}

async function roles(restaurantId: number, app: 'JOBS' | 'COMMON') {
  return (await commonCall<{ items: CommonRole[] }>(`/v1/roles`, { query: { app, orgId: restaurantId } })).items ?? [];
}

/**
 * The grants for a Jobs role: the role at the business (no outlets) or at each outlet, and common's own role for
 * the business — admin for an owner or admin, member otherwise — so they can see it in every app.
 */
async function grantsFor(restaurantId: number, role: T.RestaurantRole, outletIds: number[]) {
  const [jobs, common] = await Promise.all([roles(restaurantId, 'JOBS'), roles(restaurantId, 'COMMON')]);
  const jobsRole = jobs.find((r) => r.code === role);
  if (!jobsRole) throw new Error(`Unknown role ${role}`);
  const admin = role === 'OWNER' || role === 'ADMIN';
  const commonCode = outletIds.length === 0 ? (admin ? 'ORG_ADMIN' : 'MEMBER') : (admin ? 'OUTLET_MANAGER' : 'MEMBER');
  const commonRole = common.find((r) => r.code === commonCode);
  const scopes: { scopeType: 'ORG' | 'OUTLET'; scopeId: number | null }[] = outletIds.length === 0
    ? [{ scopeType: 'ORG', scopeId: null }]
    : outletIds.map((id) => ({ scopeType: 'OUTLET' as const, scopeId: id }));
  const grants: { roleId: number; scopeType: 'ORG' | 'OUTLET'; scopeId: number | null }[] = [];
  for (const s of scopes) {
    if (commonRole) grants.push({ roleId: commonRole.id, ...s });
    grants.push({ roleId: jobsRole.id, ...s });
  }
  return grants;
}

export async function invite(restaurantId: number, body: { mobileNumber: string; name?: string | null; role: string; outletIds?: number[] }) {
  const outletIds = body.outletIds ?? [];
  await commonCall(`/v1/orgs/${restaurantId}/invitations`, {
    method: 'POST',
    body: {
      target: body.mobileNumber,
      targetType: 'PHONE',
      name: body.name ?? null,
      grants: await grantsFor(restaurantId, body.role as T.RestaurantRole, outletIds),
      primaryOutletId: outletIds[0] ?? null,
      appCode: 'JOBS',
    },
  });
}

export async function updateMember(restaurantId: number, restaurantUserId: number, body: { role: string; outletIds: number[] }) {
  if (restaurantUserId < 0) {
    // Not signed in yet: the invitation is replaced.
    const pending = (await team(restaurantId)).find((m) => m.restaurantUserId === restaurantUserId);
    await commonCall(`/v1/invitations/${-restaurantUserId}`, { method: 'DELETE' });
    if (pending) await invite(restaurantId, { mobileNumber: pending.mobileNumber, name: pending.name, ...body });
    return;
  }
  const member = (await commonCall<{ items: CommonMember[] }>(`/v1/orgs/${restaurantId}/members`)).items
    .find((m) => m.membershipId === restaurantUserId);
  if (!member) return;
  // Common replaces every grant in one call: those in Costonomy's other apps go back unchanged.
  const kept = member.grants.filter((g) => g.app !== 'JOBS' && g.app !== 'COMMON')
    .map(({ roleId, scopeType, scopeId }) => ({ roleId, scopeType, scopeId }));
  await commonCall(`/v1/orgs/${restaurantId}/members/${restaurantUserId}/grants`, {
    method: 'PUT',
    body: {
      grants: [...(await grantsFor(restaurantId, body.role as T.RestaurantRole, body.outletIds)), ...kept],
      primaryOutletId: body.outletIds[0] ?? null,
    },
  });
}

export async function removeMember(restaurantId: number, restaurantUserId: number) {
  if (restaurantUserId < 0) {
    await commonCall(`/v1/invitations/${-restaurantUserId}`, { method: 'DELETE' });
    return;
  }
  await commonCall(`/v1/orgs/${restaurantId}/members/${restaurantUserId}`, { method: 'DELETE' });
}
