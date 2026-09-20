/**
 * Component tests for app/(auth)/login.tsx
 *
 * Covers:
 *  — Successful login → saveSession called with correct token, refreshToken,
 *    role, nameAr, and employeeId from the API response
 *  — EMPLOYEE role → router.replace('/(tabs)')
 *  — SYSTEM_ADMIN role → router.replace('/(admin)')
 *  — MAIN_MANAGER role → router.replace('/(admin)')
 *  — DEPARTMENT_MANAGER role → router.replace('/(admin)')
 *  — API error (ApiError) → Alert shown with error message, loading cleared,
 *    no navigation
 *  — Generic error (non-ApiError) → Alert shown with fallback message, no navigation
 *  — Validation: invalid national ID → no API call, error text shown
 *  — Validation: missing password → no API call, error text shown
 */

import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Mocks (jest.mock calls are hoisted; variables must start with "mock") ──────

const mockRouterReplace = jest.fn();
const mockRouterPush    = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
    push:    (...args: unknown[]) => mockRouterPush(...args),
  },
}));

jest.mock('expo-haptics', () => ({
  notificationAsync:        jest.fn(),
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// KeyboardAwareScrollViewCompat just renders children inline
jest.mock('@/components/KeyboardAwareScrollViewCompat', () => {
  const { View } = require('react-native');
  const mockReact = require('react');
  return {
    KeyboardAwareScrollViewCompat: ({ children }: { children: unknown }) =>
      mockReact.createElement(View, null, children),
  };
});

// Static image asset
jest.mock('../../assets/images/asa-logo.png', () => 1, { virtual: true });

// ── API service mock ──────────────────────────────────────────────────────────

const mockLogin = jest.fn();

jest.mock('@/services/api', () => {
  class ApiError extends Error {
    code: string;
    status: number;
    constructor(code: string, message: string, status = 0) {
      super(message);
      this.name   = 'ApiError';
      this.code   = code;
      this.status = status;
    }
  }
  return {
    authApi: {
      login: (...a: unknown[]) => mockLogin(...a),
    },
    ApiError,
  };
});

// ── Auth service mock ─────────────────────────────────────────────────────────

const mockSaveSession = jest.fn();

jest.mock('@/services/auth', () => ({
  saveSession: (...a: unknown[]) => mockSaveSession(...a),
}));

// ── Static imports (run after mocks are hoisted) ──────────────────────────────

import LoginScreen from '../app/(auth)/login';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a realistic API success response for authApi.login. */
function makeLoginResponse(role: string, mustChangePassword = false) {
  return {
    success: true,
    data: {
      accessToken:             'access.jwt.token',
      refreshToken:            'refresh.jwt.token',
      tokenType:               'Bearer',
      accessExpiresInSeconds:  900,
      refreshExpiresInDays:    7,
      employeeId:              'emp-uuid-001',
      role,
      nameAr:                  'أحمد محمد',
      status:                  'ACTIVE',
      mustChangePassword,
    },
    timestamp: new Date().toISOString(),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LoginScreen — session saving and routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveSession.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await cleanup();
  });

  // ── 1. saveSession receives all correct fields ──────────────────────────────

  it('calls saveSession with token, refreshToken, role, nameAr, and employeeId from the API response', async () => {
    mockLogin.mockResolvedValueOnce(makeLoginResponse('EMPLOYEE'));

    const { getByTestId } = await render(<LoginScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-employee-number'), '1234567890');
      fireEvent.changeText(getByTestId('input-password'), 'S3cur3P@ss');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-login'));
    });

    await waitFor(() => {
      expect(mockSaveSession).toHaveBeenCalledTimes(1);
    });

    const [session] = mockSaveSession.mock.calls[0] as any[];
    expect(session.token).toBe('access.jwt.token');
    expect(session.refreshToken).toBe('refresh.jwt.token');
    expect(session.role).toBe('EMPLOYEE');
    expect(session.nameAr).toBe('أحمد محمد');
    expect(session.employeeId).toBe('emp-uuid-001');
  });

  // ── 2. Routing: EMPLOYEE → /(tabs) ─────────────────────────────────────────

  it('navigates to /(tabs) when the authenticated role is EMPLOYEE', async () => {
    mockLogin.mockResolvedValueOnce(makeLoginResponse('EMPLOYEE'));

    const { getByTestId } = await render(<LoginScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-employee-number'), '1234567890');
      fireEvent.changeText(getByTestId('input-password'), 'S3cur3P@ss');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-login'));
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)');
    });
    expect(mockRouterReplace).not.toHaveBeenCalledWith('/(admin)');
  });

  // ── 3. Routing: SYSTEM_ADMIN → /(admin) ────────────────────────────────────

  it('navigates to /(admin) when the authenticated role is SYSTEM_ADMIN', async () => {
    mockLogin.mockResolvedValueOnce(makeLoginResponse('SYSTEM_ADMIN'));

    const { getByTestId } = await render(<LoginScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-employee-number'), '1234567890');
      fireEvent.changeText(getByTestId('input-password'), 'S3cur3P@ss');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-login'));
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(admin)');
    });
    expect(mockRouterReplace).not.toHaveBeenCalledWith('/(tabs)');
  });

  // ── 4. Routing: MAIN_MANAGER → /(admin) ────────────────────────────────────

  it('navigates to /(admin) when the authenticated role is MAIN_MANAGER', async () => {
    mockLogin.mockResolvedValueOnce(makeLoginResponse('MAIN_MANAGER'));

    const { getByTestId } = await render(<LoginScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-employee-number'), '1234567890');
      fireEvent.changeText(getByTestId('input-password'), 'S3cur3P@ss');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-login'));
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(admin)');
    });
    expect(mockRouterReplace).not.toHaveBeenCalledWith('/(tabs)');
  });

  // ── 5. Routing: DEPARTMENT_MANAGER → /(admin) ──────────────────────────────

  it('navigates to /(admin) when the authenticated role is DEPARTMENT_MANAGER', async () => {
    mockLogin.mockResolvedValueOnce(makeLoginResponse('DEPARTMENT_MANAGER'));

    const { getByTestId } = await render(<LoginScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-employee-number'), '1234567890');
      fireEvent.changeText(getByTestId('input-password'), 'S3cur3P@ss');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-login'));
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(admin)');
    });
    expect(mockRouterReplace).not.toHaveBeenCalledWith('/(tabs)');
  });

  // ── 6. ApiError → Alert shown, loading cleared, no navigation ──────────────

  it('shows an Alert with the ApiError message, clears loading, and does not navigate', async () => {
    const { ApiError: AE } = require('@/services/api');
    mockLogin.mockRejectedValueOnce(
      new AE('INVALID_CREDENTIALS', 'Invalid national ID or password.', 401)
    );

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    const { getByTestId } = await render(<LoginScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-employee-number'), '1234567890');
      fireEvent.changeText(getByTestId('input-password'), 'S3cur3P@ss');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-login'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Sign In Failed',
        'Invalid national ID or password.'
      );
    });

    // Must not navigate on error
    expect(mockRouterReplace).not.toHaveBeenCalled();

    // Loading cleared — button is no longer disabled
    const loginBtn = getByTestId('btn-login');
    expect(loginBtn.props.accessibilityState?.disabled).not.toBe(true);

    alertSpy.mockRestore();
  });

  // ── 7. Generic (non-ApiError) → fallback Alert message ─────────────────────

  it('shows a generic fallback Alert message for non-ApiError exceptions', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Network request failed'));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    const { getByTestId } = await render(<LoginScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-employee-number'), '1234567890');
      fireEvent.changeText(getByTestId('input-password'), 'S3cur3P@ss');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-login'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Sign In Failed',
        'Login failed. Please try again.'
      );
    });

    expect(mockRouterReplace).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  // ── 8. Validation: bad national ID → no API call ───────────────────────────

  it('does not call the login API when the national ID is not 10 digits', async () => {
    const { getByTestId } = await render(<LoginScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-employee-number'), '12345');
      fireEvent.changeText(getByTestId('input-password'), 'password123');
      fireEvent.press(getByTestId('btn-login'));
    });

    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  // ── 9. Validation: missing password → no API call ──────────────────────────

  it('does not call the login API when the password field is empty', async () => {
    const { getByTestId } = await render(<LoginScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-employee-number'), '1234567890');
      // intentionally leave password empty
      fireEvent.press(getByTestId('btn-login'));
    });

    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  // ── 10. mustChangePassword → route to change-password screen ───────────────

  it('routes to /(auth)/change-password with the employee role when mustChangePassword is true', async () => {
    mockLogin.mockResolvedValueOnce(makeLoginResponse('EMPLOYEE', true));

    const { getByTestId } = await render(<LoginScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-employee-number'), '1234567890');
      fireEvent.changeText(getByTestId('input-password'), 'S3cur3P@ss');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-login'));
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(auth)/change-password',
          params:   expect.objectContaining({ role: 'EMPLOYEE' }),
        })
      );
    });

    // Must NOT proceed to the normal home screen
    expect(mockRouterReplace).not.toHaveBeenCalledWith('/(tabs)');
    expect(mockRouterReplace).not.toHaveBeenCalledWith('/(admin)');
  });

  // ── 11. mustChangePassword for admin role → still routes to change-password ─

  it('routes to /(auth)/change-password (not /(admin)) when mustChangePassword is true for a SYSTEM_ADMIN', async () => {
    mockLogin.mockResolvedValueOnce(makeLoginResponse('SYSTEM_ADMIN', true));

    const { getByTestId } = await render(<LoginScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-employee-number'), '1234567890');
      fireEvent.changeText(getByTestId('input-password'), 'S3cur3P@ss');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-login'));
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(auth)/change-password',
          params:   expect.objectContaining({ role: 'SYSTEM_ADMIN' }),
        })
      );
    });

    expect(mockRouterReplace).not.toHaveBeenCalledWith('/(admin)');
    expect(mockRouterReplace).not.toHaveBeenCalledWith('/(tabs)');
  });
});
