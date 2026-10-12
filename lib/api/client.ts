import { API_URL, COMMON_URL } from '@/lib/config';
import { getLocale } from '@/lib/locale';
import type { Envelope } from './types';

/**
 * A failure the API described, or the network failing to reach it.
 *
 * `code` is the API's stable error name (`OTP_INVALID`, `PROFILE_INCOMPLETE`) or
 * `NETWORK` when no response arrived. Screens branch on `code`; they show
 * `message`, which is already in the user's language because every request
 * carries `Accept-Language`.
 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly fieldErrors: { field: string; message: string }[] = [],
  ) {
    super(message);
  }

  /** The inline message for one form field, if the server rejected it. */
  field(name: string): string | undefined {
    return this.fieldErrors.find((f) => f.field === name)?.message;
  }
}

export interface Page<T> {
  data: T;
  hasMore: boolean;
  nextOffset: number | null;
}

// ── Auth hooks, supplied by the session store ────────────────────────────────
// Injected rather than imported, so the session can call the API without the
// two modules importing each other.

interface AuthBinding {
  accessToken: () => string | undefined;
  refresh: () => Promise<boolean>;
  signedOut: () => void;
}

let auth: AuthBinding = {
  accessToken: () => undefined,
  refresh: async () => false,
  signedOut: () => {},
};

export function bindAuth(binding: AuthBinding) {
  auth = binding;
}

// ── Request ──────────────────────────────────────────────────────────────────

type Query = Record<string, string | number | boolean | undefined | null | (string | number)[]>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  /** False for the handful of public endpoints (OTP, reference data). */
  authenticated?: boolean;
  /** A token to send instead of the session's: the first call after sign-in, before the session holds it. */
  token?: string;
}

function buildUrl(path: string, query?: Query, base = API_URL): string {
  if (!query) return base + path;
  const params: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    const values = Array.isArray(value) ? value : [value];
    for (const v of values) params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return params.length ? `${base}${path}?${params.join('&')}` : base + path;
}

async function send(path: string, opts: RequestOptions, base = API_URL): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': getLocale(),
  };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = opts.authenticated === false ? undefined : opts.token ?? auth.accessToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    return await fetch(buildUrl(path, opts.query, base), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new ApiError('NETWORK', 'No connection', 0);
  }
}

async function parse<T>(response: Response): Promise<Envelope<T>> {
  if (response.status === 204) {
    return { data: undefined as T, error: null, meta: null };
  }
  try {
    return (await response.json()) as Envelope<T>;
  } catch {
    throw new ApiError('UNEXPECTED', 'Something went wrong', response.status);
  }
}

/**
 * One API call, with a single transparent retry after refreshing an expired
 * access token. A second 401, or a refresh that fails, signs the user out — the
 * app never loops on a dead session.
 */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<Page<T>> {
  let response = await send(path, opts);

  if (response.status === 401 && opts.authenticated !== false) {
    const body = await parse<T>(response).catch(() => null);
    if (body?.error?.code === 'TOKEN_EXPIRED' && (await auth.refresh())) {
      response = await send(path, opts);
    } else {
      auth.signedOut();
      throw new ApiError(body?.error?.code ?? 'UNAUTHENTICATED', body?.error?.message ?? '', 401);
    }
  }

  const envelope = await parse<T>(response);
  if (!response.ok || envelope.error) {
    const e = envelope.error;
    // 401 is a dead session. A deleted or suspended account answers 403 on every
    // request, so staying signed in would only show the same error on every screen.
    if (opts.authenticated !== false && (response.status === 401 || e?.code === 'ACCOUNT_DELETED' || e?.code === 'ACCOUNT_SUSPENDED')) {
      auth.signedOut();
    }
    throw new ApiError(e?.code ?? 'UNEXPECTED', e?.message ?? 'Something went wrong', response.status, e?.fieldErrors);
  }

  const offset = typeof opts.query?.offset === 'number' ? opts.query.offset : 0;
  const nextCursor = envelope.meta?.nextCursor;
  return {
    data: envelope.data,
    hasMore: envelope.meta?.hasMore ?? false,
    nextOffset: nextCursor != null ? Number(nextCursor) : envelope.meta?.hasMore ? offset : null,
  };
}

/** The common case: just the data. */
export async function call<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  return (await request<T>(path, opts)).data;
}

/**
 * A call to costonomy-common-api. Same session and the same one refresh on an expired token; common answers with the
 * resource itself (no envelope) and errors as `{ error: { code, message, details } }`.
 */
export async function commonCall<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  let response = await send(path, opts, COMMON_URL);
  if (response.status === 401 && opts.authenticated !== false && !opts.token) {
    const body = await response.clone().json().catch(() => null);
    if (body?.error?.code === 'TOKEN_EXPIRED' && (await auth.refresh())) {
      response = await send(path, opts, COMMON_URL);
    }
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const e = body?.error;
    if (opts.authenticated !== false && !opts.token && response.status === 401) auth.signedOut();
    const fields = e?.details?.fields as Record<string, string> | undefined;
    throw new ApiError(e?.code ?? 'UNEXPECTED', e?.message ?? 'Something went wrong', response.status,
      fields ? Object.entries(fields).map(([field, message]) => ({ field, message })) : []);
  }
  return body as T;
}
