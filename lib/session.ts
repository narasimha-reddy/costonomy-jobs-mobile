import { useSyncExternalStore } from 'react';
import { api, type Me, type VerifyOtpResponse } from '@/lib/api';
import { bindAuth } from '@/lib/api/client';
import { setLocale, type Locale, SUPPORTED_LOCALES } from '@/lib/locale';
import { storage } from '@/lib/storage';
import { queryClient } from '@/lib/query';

/**
 * Who is signed in, and which side of the app they are using.
 *
 * A module store rather than a context, for the same reason as `lib/locale`: the
 * API client needs the token outside any component tree.
 *
 * **The active role is a view choice, never a permission.** A phone number can hold
 * a job profile and several restaurant memberships at once; the server re-derives
 * authority from those rows on every request, whatever this store says.
 */
export type ActiveRole = 'candidate' | 'restaurant';

export interface SessionState {
  status: 'loading' | 'signedOut' | 'signedIn';
  me: Me | null;
  role: ActiveRole | null;
  restaurantId: number | null;
  /** True once the user has picked a language on this device. */
  languageChosen: boolean;
}

const KEYS = {
  access: 'cj.accessToken',
  refresh: 'cj.refreshToken',
  role: 'cj.role',
  restaurant: 'cj.restaurantId',
  locale: 'cj.locale',
} as const;

let state: SessionState = { status: 'loading', me: null, role: null, restaurantId: null, languageChosen: false };
let accessToken: string | undefined;
let refreshToken: string | undefined;
const listeners = new Set<() => void>();

function set(patch: Partial<SessionState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getSession(): SessionState {
  return state;
}

export function useSession(): SessionState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getSession,
    getSession,
  );
}

// ── Tokens ───────────────────────────────────────────────────────────────────

let refreshing: Promise<boolean> | null = null;

/** One refresh at a time: ten requests expiring together must not rotate the token ten times. */
function refreshTokens(): Promise<boolean> {
  if (!refreshToken) return Promise.resolve(false);
  refreshing ??= (async () => {
    try {
      const pair = await api.auth.refresh(refreshToken!);
      await saveTokens(pair.accessToken, pair.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function saveTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  await Promise.all([storage.set(KEYS.access, access), storage.set(KEYS.refresh, refresh)]);
}

bindAuth({
  accessToken: () => accessToken,
  refresh: refreshTokens,
  signedOut: () => {
    void clearLocal();
  },
});

// ── Lifecycle ────────────────────────────────────────────────────────────────

/** Restores the saved session, then asks the server who this is. */
export async function bootstrap(): Promise<void> {
  const [access, refresh, role, restaurant, locale] = await Promise.all([
    storage.get(KEYS.access),
    storage.get(KEYS.refresh),
    storage.get(KEYS.role),
    storage.get(KEYS.restaurant),
    storage.get(KEYS.locale),
  ]);

  if (locale && (SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    setLocale(locale as Locale);
  }
  const languageChosen = locale != null;

  if (!access || !refresh) {
    set({ status: 'signedOut', languageChosen });
    return;
  }

  accessToken = access;
  refreshToken = refresh;
  try {
    const me = await api.me.get();
    applyServerLanguage(me);
    set({
      status: 'signedIn',
      me,
      languageChosen: true,
      role: (role as ActiveRole | null) ?? null,
      restaurantId: restaurant ? Number(restaurant) : null,
    });
    normaliseRole();
  } catch {
    // A network failure at launch must not sign someone out; only a rejected
    // session does, and the client has already cleared that one.
    if (state.status === 'loading') {
      set({ status: accessToken ? 'signedIn' : 'signedOut', languageChosen });
    }
  }
}

export async function chooseLanguage(locale: Locale) {
  setLocale(locale);
  await storage.set(KEYS.locale, locale);
  set({ languageChosen: true });
  if (state.status === 'signedIn') {
    // Notifications are written in the account's language, so the server needs
    // to know too — not only this screen.
    try {
      const me = await api.me.update({ preferredLanguage: locale });
      set({ me });
    } catch {
      /* the local switch still stands */
    }
  }
}

export async function signIn(response: VerifyOtpResponse) {
  await saveTokens(response.accessToken, response.refreshToken);
  const { accessToken: _a, refreshToken: _r, expiresInSeconds: _e, ...me } = response;
  applyServerLanguage(me);
  set({ status: 'signedIn', me });
  normaliseRole();
}

/** Re-reads contexts after creating a profile or a restaurant. */
export async function refreshMe(): Promise<Me | null> {
  try {
    const me = await api.me.get();
    set({ me });
    normaliseRole();
    return me;
  } catch {
    return null;
  }
}

export async function setRole(role: ActiveRole, restaurantId?: number) {
  const nextRestaurant = restaurantId ?? state.restaurantId ?? state.me?.restaurantMemberships[0]?.restaurantId ?? null;
  set({ role, restaurantId: role === 'restaurant' ? nextRestaurant : state.restaurantId });
  await storage.set(KEYS.role, role);
  if (nextRestaurant != null) await storage.set(KEYS.restaurant, String(nextRestaurant));
  queryClient.removeQueries({ queryKey: ['notifications'] });
}

export async function signOut() {
  const token = refreshToken;
  if (token) {
    try {
      await api.auth.logout(token);
    } catch {
      /* signing out locally is what matters */
    }
  }
  await clearLocal();
}

/**
 * After the account has been deleted: the server has already ended every session,
 * so there is nothing to log out of — only local state to forget.
 */
export async function forgetDeletedAccount() {
  await clearLocal();
}

async function clearLocal() {
  accessToken = undefined;
  refreshToken = undefined;
  await Promise.all([KEYS.access, KEYS.refresh, KEYS.role, KEYS.restaurant].map((k) => storage.remove(k)));
  queryClient.clear();
  set({ status: 'signedOut', me: null, role: null, restaurantId: null });
}

// ── helpers ──────────────────────────────────────────────────────────────────

/** The account's language wins over this device's last choice on sign-in. */
function applyServerLanguage(me: Me) {
  const lang = me.user.preferredLanguage;
  if ((SUPPORTED_LOCALES as readonly string[]).includes(lang)) {
    setLocale(lang);
    void storage.set(KEYS.locale, lang);
  }
}

/**
 * Keeps the active role pointing at something the user actually has. A saved
 * "restaurant" for someone whose only membership was removed falls back to the
 * candidate side, and vice versa.
 */
function normaliseRole() {
  const me = state.me;
  if (!me) return;
  const hasCandidate = me.employeeProfile != null;
  const memberships = me.restaurantMemberships;
  const hasRestaurant = memberships.length > 0;

  let role = state.role;
  if (role === 'restaurant' && !hasRestaurant) role = hasCandidate ? 'candidate' : null;
  if (role === 'candidate' && !hasCandidate) role = hasRestaurant ? 'restaurant' : null;
  if (role == null) role = hasRestaurant && !hasCandidate ? 'restaurant' : hasCandidate ? 'candidate' : null;

  let restaurantId = state.restaurantId;
  if (hasRestaurant && !memberships.some((m) => m.restaurantId === restaurantId)) {
    restaurantId = memberships[0]!.restaurantId;
  }
  if (role !== state.role || restaurantId !== state.restaurantId) {
    set({ role, restaurantId });
    if (role) void storage.set(KEYS.role, role);
    if (restaurantId != null) void storage.set(KEYS.restaurant, String(restaurantId));
  }
}

export function activeMembership() {
  return state.me?.restaurantMemberships.find((m) => m.restaurantId === state.restaurantId) ?? null;
}
