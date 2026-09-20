/**
 * Tests for api.ts — silent token refresh and session-expired behaviour
 *
 * Covers:
 *  — authApi.logout posts to /v1/auth/logout with the refresh token
 *  — A near-expiry token triggers a proactive refresh before the request
 *  — Failed refresh (server rejects) → clearSession + session-expired callback
 *  — Failed refresh (network error)  → clearSession + session-expired callback
 *  — Missing refresh token           → clearSession + session-expired callback
 *  — Concurrent 401s coalesce into one refresh request (no stampede)
 *  — No Authorization header when loadSession returns null
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockLoadSession    = jest.fn();
const mockUpdateTokens   = jest.fn();
const mockClearSession   = jest.fn();
const mockIsTokenExpired = jest.fn();

jest.mock('../services/auth', () => ({
  loadSession:     (...args: unknown[]) => mockLoadSession(...args),
  updateTokens:    (...args: unknown[]) => mockUpdateTokens(...args),
  clearSession:    (...args: unknown[]) => mockClearSession(...args),
  isTokenExpired:  (...args: unknown[]) => mockIsTokenExpired(...args),
  saveSession:     jest.fn(),
  parseJwtPayload: jest.fn(() => null),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { authApi, setSessionExpiredCallback } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function okEnvelope<T>(data: T) {
  return { success: true, data, timestamp: new Date().toISOString() };
}
function errEnvelope(code: string, message: string) {
  return { success: false, error: { code, message }, timestamp: new Date().toISOString() };
}
function fetchOk(body: unknown, status = 200): Response {
  return { ok: true,  status, json: async () => body } as unknown as Response;
}
function fetchFail(body: unknown, status: number): Response {
  return { ok: false, status, json: async () => body } as unknown as Response;
}

const VALID_SESSION = {
  token:        'access-tok',
  refreshToken: 'refresh-tok',
  role:         'EMPLOYEE',
  nameAr:       'أحمد',
  employeeId:   'emp-1',
};

const REFRESH_RESPONSE = {
  accessToken:             'new-access-tok',
  refreshToken:            'new-refresh-tok',
  tokenType:               'Bearer',
  accessExpiresInSeconds:  900,
  refreshExpiresInDays:    30,
  employeeId:              'emp-1',
  role:                    'EMPLOYEE',
  nameAr:                  'أحمد',
  status:                  'ACTIVE',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('api.ts — silent refresh and session-expired behaviour', () => {
  const sessionExpiredSpy = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();

    mockLoadSession.mockResolvedValue(VALID_SESSION);
    mockIsTokenExpired.mockReturnValue(false);
    mockClearSession.mockResolvedValue(undefined);
    mockUpdateTokens.mockResolvedValue(undefined);

    sessionExpiredSpy.mockReset();
    setSessionExpiredCallback(sessionExpiredSpy);
  });

  // ── 1. authApi.logout ───────────────────────────────────────────────────────

  it('authApi.logout posts to /v1/auth/logout with the refresh token in the body', async () => {
    mockFetch.mockResolvedValueOnce(fetchOk(okEnvelope(undefined)));

    await authApi.logout('refresh-tok');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/v1\/auth\/logout$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ refreshToken: 'refresh-tok' });
  });

  // ── 2. Proactive refresh for near-expiry token ──────────────────────────────

  it('proactively refreshes when the access token is near-expiry, then sends the real request', async () => {
    mockIsTokenExpired.mockReturnValue(true); // token is expired / near-expiry

    // After refresh, loadSession returns the updated token
    mockLoadSession
      .mockResolvedValueOnce(VALID_SESSION)                           // initial load
      .mockResolvedValueOnce({ ...VALID_SESSION, token: 'new-access-tok' }); // after refresh

    mockFetch
      .mockResolvedValueOnce(fetchOk(okEnvelope(REFRESH_RESPONSE)))  // POST /v1/auth/refresh
      .mockResolvedValueOnce(fetchOk(okEnvelope([])));                // GET  /v1/auth/sessions

    await authApi.getSessions();

    const urls = mockFetch.mock.calls.map(([u]) => u as string);
    expect(urls[0]).toMatch(/\/v1\/auth\/refresh$/);
    expect(urls[1]).toMatch(/\/v1\/auth\/sessions$/);
    expect(mockUpdateTokens).toHaveBeenCalledWith(
      REFRESH_RESPONSE.accessToken,
      REFRESH_RESPONSE.refreshToken,
    );
  });

  // ── 3. Failed refresh → clearSession + session-expired callback ─────────────

  it('clears the session and fires the expired callback when the refresh endpoint rejects (401)', async () => {
    // Authenticated request → 401
    // Refresh attempt → 401 (refresh token also invalid / revoked)
    mockFetch
      .mockResolvedValueOnce(fetchFail(errEnvelope('UNAUTHORIZED', 'Token expired'), 401))
      .mockResolvedValueOnce(fetchFail(errEnvelope('INVALID_TOKEN', 'Refresh invalid'), 401));

    await expect(authApi.getSessions()).rejects.toThrow();

    expect(mockClearSession).toHaveBeenCalled();
    expect(sessionExpiredSpy).toHaveBeenCalled();
  });

  it('clears the session and fires the expired callback when the refresh request throws (network error)', async () => {
    mockFetch
      .mockResolvedValueOnce(fetchFail(errEnvelope('UNAUTHORIZED', 'Token expired'), 401))
      .mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(authApi.getSessions()).rejects.toThrow();

    expect(mockClearSession).toHaveBeenCalled();
    expect(sessionExpiredSpy).toHaveBeenCalled();
  });

  // ── 4. Missing refresh token → clearSession + session-expired ───────────────

  it('clears the session when no refresh token is available', async () => {
    mockLoadSession.mockResolvedValue({ ...VALID_SESSION, refreshToken: '' });

    // Authenticated request → 401 triggers silentRefresh
    mockFetch.mockResolvedValueOnce(
      fetchFail(errEnvelope('UNAUTHORIZED', 'Token expired'), 401),
    );

    await expect(authApi.getSessions()).rejects.toThrow();

    expect(mockClearSession).toHaveBeenCalled();
    expect(sessionExpiredSpy).toHaveBeenCalled();
  });

  // ── 5. Concurrent 401s coalesce into one refresh (no stampede) ─────────────

  it('sends only one refresh request when two authenticated calls receive 401 concurrently', async () => {
    mockFetch
      .mockResolvedValueOnce(fetchFail(errEnvelope('UNAUTHORIZED', 'expired'), 401)) // req A → 401
      .mockResolvedValueOnce(fetchFail(errEnvelope('UNAUTHORIZED', 'expired'), 401)) // req B → 401
      .mockResolvedValueOnce(fetchOk(okEnvelope(REFRESH_RESPONSE)))                  // refresh (once)
      .mockResolvedValue(fetchOk(okEnvelope([])));                                    // retries

    mockLoadSession.mockResolvedValue(VALID_SESSION);

    await Promise.allSettled([authApi.getSessions(), authApi.getSessions()]);

    const refreshCalls = mockFetch.mock.calls.filter(([u]) =>
      (u as string).includes('/v1/auth/refresh'),
    );
    expect(refreshCalls.length).toBe(1);
  });

  // ── 6. No Authorization header when session is absent ──────────────────────

  it('omits the Authorization header when loadSession returns null', async () => {
    mockLoadSession.mockResolvedValue(null);
    mockFetch.mockResolvedValueOnce(fetchOk(okEnvelope([])));

    await authApi.getSessions();

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toBeUndefined();
  });
});
