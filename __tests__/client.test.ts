import { ApiError, bindAuth, call, request } from '@/lib/api/client';

type Reply = { status: number; body: unknown };
const replies: Reply[] = [];
const sent: { url: string; init: RequestInit }[] = [];

beforeEach(() => {
  replies.length = 0;
  sent.length = 0;
  global.fetch = jest.fn(async (url: string, init: RequestInit) => {
    sent.push({ url, init });
    const next = replies.shift();
    if (!next) throw new TypeError('Network request failed');
    return { status: next.status, ok: next.status < 400, json: async () => next.body } as Response;
  }) as unknown as typeof fetch;
});

const envelope = (data: unknown, meta: unknown = null) => ({ data, error: null, meta });
const failure = (code: string, message = code) => ({ data: null, error: { code, message, fieldErrors: [] }, meta: null });

describe('API client', () => {
  it('refreshes an expired token once and retries the request', async () => {
    let token = 'old';
    const signedOut = jest.fn();
    bindAuth({ accessToken: () => token, refresh: async () => { token = 'new'; return true; }, signedOut });
    replies.push({ status: 401, body: failure('TOKEN_EXPIRED') }, { status: 200, body: envelope({ ok: true }) });

    await expect(call('/users/me')).resolves.toEqual({ ok: true });
    expect((sent[1]!.init.headers as Record<string, string>).Authorization).toBe('Bearer new');
    expect(signedOut).not.toHaveBeenCalled();
  });

  it('signs out on a dead session rather than looping', async () => {
    const signedOut = jest.fn();
    bindAuth({ accessToken: () => 't', refresh: async () => false, signedOut });
    replies.push({ status: 401, body: failure('TOKEN_INVALID') });

    await expect(call('/users/me')).rejects.toMatchObject({ code: 'TOKEN_INVALID' });
    expect(signedOut).toHaveBeenCalledTimes(1);
  });

  it('signs out when the account was deleted, which answers 403 on every request', async () => {
    const signedOut = jest.fn();
    bindAuth({ accessToken: () => 't', refresh: async () => false, signedOut });
    replies.push({ status: 403, body: failure('ACCOUNT_DELETED') });

    await expect(call('/jobs')).rejects.toBeInstanceOf(ApiError);
    expect(signedOut).toHaveBeenCalledTimes(1);
  });

  it('keeps the session for an ordinary error and passes field errors through', async () => {
    const signedOut = jest.fn();
    bindAuth({ accessToken: () => 't', refresh: async () => false, signedOut });
    replies.push({ status: 422, body: { data: null, meta: null, error: { code: 'VALIDATION_FAILED', message: 'Fix it', fieldErrors: [{ field: 'name', message: 'Too short' }] } } });

    const error = await call('/users/me').catch((e) => e as ApiError);
    expect(error.field('name')).toBe('Too short');
    expect(signedOut).not.toHaveBeenCalled();
  });

  it('reports no connection as NETWORK', async () => {
    bindAuth({ accessToken: () => undefined, refresh: async () => false, signedOut: jest.fn() });
    await expect(call('/roles')).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('repeats array query parameters and skips empty ones', async () => {
    bindAuth({ accessToken: () => undefined, refresh: async () => false, signedOut: jest.fn() });
    replies.push({ status: 200, body: envelope([], { hasMore: true, nextCursor: '20' }) });

    const page = await request('/jobs', { query: { cityId: 1, skillIds: [3, 4], q: '', roleId: undefined } });
    expect(sent[0]!.url).toMatch(/\/jobs\?cityId=1&skillIds=3&skillIds=4$/);
    expect(page).toEqual({ data: [], hasMore: true, nextOffset: 20 });
  });
});
