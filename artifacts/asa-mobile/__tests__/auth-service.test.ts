/**
 * Unit tests for services/auth.ts
 *
 * Covers:
 *  — saveSession/loadSession round-trip stores every field correctly
 *  — saveSession persists to SecureStore (not only in-memory) on native
 *  — clearSession removes all keys so loadSession returns null
 *  — clearSession calls SecureStore.deleteItemAsync for every key
 *  — loadSession returns null when token or role is absent
 *  — loadSession tolerates a missing refreshToken (uses empty string)
 *  — loadSession returns null gracefully when SecureStore.getItemAsync throws
 *  — updateTokens replaces only token and refreshToken, other fields intact
 *  — isTokenExpired correctly classifies expired / near-expiry / valid / malformed tokens
 *  — parseJwtPayload extracts claims from a well-formed token; returns null for malformed
 */

// ── SecureStore mock ──────────────────────────────────────────────────────────
// jest-expo sets Platform.OS to 'ios', so auth.ts takes the SecureStore path.

const mockSecureStore: Record<string, string> = {};
const mockSetItemAsync    = jest.fn(async (key: string, val: string) => { mockSecureStore[key] = val; });
const mockGetItemAsync    = jest.fn(async (key: string) => mockSecureStore[key] ?? null);
const mockDeleteItemAsync = jest.fn(async (key: string) => { delete mockSecureStore[key]; });

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  setItemAsync:    (key: string, val: string) => mockSetItemAsync(key, val),
  getItemAsync:    (key: string) => mockGetItemAsync(key),
  deleteItemAsync: (key: string) => mockDeleteItemAsync(key),
}));

// ── Imports (after mocks are hoisted) ─────────────────────────────────────────

import {
  saveSession,
  loadSession,
  clearSession,
  updateTokens,
  isTokenExpired,
  parseJwtPayload,
  type Session,
} from '../services/auth';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    token:        'access.token.value',
    refreshToken: 'refresh.token.value',
    role:         'EMPLOYEE',
    nameAr:       'أحمد محمد',
    employeeId:   'emp-uuid-001',
    ...overrides,
  };
}

/**
 * Build a minimal JWT with a given `exp` claim. Uses standard base64 (with
 * padding) so that jsdom's `atob` can decode the payload segment — the
 * parseJwtPayload function converts `-`/`_` chars but leaves padding intact.
 */
function makeJwt(expSeconds: number): string {
  const payload = { sub: 'emp-1', exp: expSeconds, iat: expSeconds - 3600 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `header.${encoded}.signature`;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('auth.ts — session persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockSecureStore).forEach((k) => delete mockSecureStore[k]);
  });

  // ── 1. saveSession + loadSession round-trip ─────────────────────────────────

  it('saveSession + loadSession round-trip returns all original fields', async () => {
    const session = makeSession();

    await saveSession(session);
    const loaded = await loadSession();

    expect(loaded).not.toBeNull();
    expect(loaded!.token).toBe(session.token);
    expect(loaded!.refreshToken).toBe(session.refreshToken);
    expect(loaded!.role).toBe(session.role);
    expect(loaded!.nameAr).toBe(session.nameAr);
    expect(loaded!.employeeId).toBe(session.employeeId);
  });

  it('saveSession calls SecureStore.setItemAsync for every key on native', async () => {
    await saveSession(makeSession());

    const calledKeys = mockSetItemAsync.mock.calls.map(([k]) => k as string);
    expect(calledKeys).toEqual(
      expect.arrayContaining(['asa_jwt', 'asa_refresh', 'asa_role', 'asa_name', 'asa_eid'])
    );
  });

  // ── 2. clearSession ─────────────────────────────────────────────────────────

  it('clearSession removes all keys so loadSession returns null', async () => {
    await saveSession(makeSession());
    expect(await loadSession()).not.toBeNull();

    await clearSession();

    expect(await loadSession()).toBeNull();
  });

  it('clearSession calls SecureStore.deleteItemAsync for every key', async () => {
    await saveSession(makeSession());
    await clearSession();

    const deletedKeys = mockDeleteItemAsync.mock.calls.map(([k]) => k as string);
    expect(deletedKeys).toEqual(
      expect.arrayContaining(['asa_jwt', 'asa_refresh', 'asa_role', 'asa_name', 'asa_eid'])
    );
  });

  // ── 3. Partial data → null ──────────────────────────────────────────────────

  it('loadSession returns null when the token (asa_jwt) is absent', async () => {
    mockSecureStore['asa_role']    = 'EMPLOYEE';
    mockSecureStore['asa_refresh'] = 'ref';
    mockSecureStore['asa_name']    = 'أحمد';
    mockSecureStore['asa_eid']     = 'emp-1';
    // asa_jwt intentionally missing

    expect(await loadSession()).toBeNull();
  });

  it('loadSession returns null when the role (asa_role) is absent', async () => {
    mockSecureStore['asa_jwt']     = 'tok';
    mockSecureStore['asa_refresh'] = 'ref';
    mockSecureStore['asa_name']    = 'أحمد';
    mockSecureStore['asa_eid']     = 'emp-1';
    // asa_role intentionally missing

    expect(await loadSession()).toBeNull();
  });

  it('loadSession uses empty string for a missing refreshToken', async () => {
    mockSecureStore['asa_jwt']  = 'tok';
    mockSecureStore['asa_role'] = 'EMPLOYEE';
    // asa_refresh absent

    const loaded = await loadSession();
    expect(loaded).not.toBeNull();
    expect(loaded!.refreshToken).toBe('');
  });

  // ── 4. SecureStore failure → graceful null, no throw ───────────────────────

  it('loadSession returns null (does not throw) when SecureStore.getItemAsync rejects', async () => {
    // mockRejectedValueOnce so the implementation doesn't bleed into later tests
    mockGetItemAsync.mockRejectedValueOnce(new Error('Keychain unavailable'));

    await expect(loadSession()).resolves.toBeNull();
  });

  // ── 5. updateTokens ─────────────────────────────────────────────────────────

  it('updateTokens replaces token and refreshToken without touching other fields', async () => {
    await saveSession(makeSession({ role: 'MAIN_MANAGER', nameAr: 'محمد' }));

    await updateTokens('new-access', 'new-refresh');

    const loaded = await loadSession();
    expect(loaded!.token).toBe('new-access');
    expect(loaded!.refreshToken).toBe('new-refresh');
    // Other fields must survive
    expect(loaded!.role).toBe('MAIN_MANAGER');
    expect(loaded!.nameAr).toBe('محمد');
  });

  // ── 6. isTokenExpired ───────────────────────────────────────────────────────

  it('returns true for a token whose exp is in the past', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 60;
    expect(isTokenExpired(makeJwt(pastExp))).toBe(true);
  });

  it('returns true for a token expiring within the 30-second safety buffer', () => {
    const almostExpired = Math.floor(Date.now() / 1000) + 10; // expires in 10s
    expect(isTokenExpired(makeJwt(almostExpired))).toBe(true);
  });

  it('returns false for a token with plenty of lifetime remaining', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    expect(isTokenExpired(makeJwt(futureExp))).toBe(false);
  });

  it('returns true for a malformed token (not parseable)', () => {
    expect(isTokenExpired('onlyone')).toBe(true);
    expect(isTokenExpired('')).toBe(true);
  });

  // ── 7. parseJwtPayload ──────────────────────────────────────────────────────

  it('returns null for a malformed token', () => {
    expect(parseJwtPayload('bad')).toBeNull();
    expect(parseJwtPayload('')).toBeNull();
  });

  it('extracts the exp claim from a well-formed token', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const payload = parseJwtPayload(makeJwt(exp));
    expect(payload).not.toBeNull();
    expect(payload!.exp).toBe(exp);
  });
});
