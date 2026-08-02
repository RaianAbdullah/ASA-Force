/**
 * Component tests for app/(auth)/register.tsx
 *
 * Covers:
 *  — Correct API fields sent: nationalId (from employeeNumber), firstNameAr,
 *    lastNameAr, phoneNumber, password — confirmPassword is NOT forwarded
 *  — Success → router.push to /(auth)/verify-otp with nationalId + maskedPhone
 *  — ApiError → Alert shown with error message, loading cleared, no navigation
 *  — Generic error → fallback Alert message, no navigation
 *  — Validation: invalid employee number → no API call
 *  — Validation: password too short → no API call
 *  — Validation: passwords do not match → no API call
 *  — Validation: missing first name → no API call
 */

import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Mocks (jest.mock calls are hoisted; variables must start with "mock") ──────

const mockRouterPush    = jest.fn();
const mockRouterBack    = jest.fn();
const mockRouterReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push:    (...args: unknown[]) => mockRouterPush(...args),
    back:    (...args: unknown[]) => mockRouterBack(...args),
    replace: (...args: unknown[]) => mockRouterReplace(...args),
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

const mockRegister = jest.fn();

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
      register: (...args: unknown[]) => mockRegister(...args),
    },
    ApiError,
  };
});

// ── Static imports (run after mocks are hoisted) ──────────────────────────────

import RegisterScreen from '../app/(auth)/register';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal success response for authApi.register. */
function makeRegisterResponse(maskedPhone = '05***4567') {
  return {
    success: true,
    data: {
      employeeId:  'emp-uuid-001',
      nationalId:  '1234567890',
      status:      'PENDING_OTP',
      message:     'OTP sent',
      maskedPhone,
    },
    timestamp: new Date().toISOString(),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RegisterScreen — field mapping and routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  // ── 1. Correct API fields sent ─────────────────────────────────────────────

  it('calls authApi.register with nationalId (employeeNumber), names, phone, password — not confirmPassword', async () => {
    mockRegister.mockResolvedValueOnce(makeRegisterResponse());

    const { getByTestId } = await render(<RegisterScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-firstNameAr'),    'أحمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-lastNameAr'),     'محمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-employeeNumber'), '1234567890');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-phoneNumber'),    '+966501234567');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-password'),       'SecurePass123!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'),'SecurePass123!');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-register'));
    });

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledTimes(1);
    });

    const [body] = mockRegister.mock.calls[0] as any[];
    expect(body.nationalId).toBe('1234567890');       // mapped from employeeNumber
    expect(body.firstNameAr).toBe('أحمد');
    expect(body.lastNameAr).toBe('محمد');
    expect(body.phoneNumber).toBe('+966501234567');
    expect(body.password).toBe('SecurePass123!');
    expect(body).not.toHaveProperty('confirmPassword'); // must NOT be forwarded
    expect(body).not.toHaveProperty('employeeNumber');  // internal field name
  });

  // ── 2. Success → navigate to verify-otp ───────────────────────────────────

  it('navigates to /(auth)/verify-otp with nationalId and maskedPhone on success', async () => {
    mockRegister.mockResolvedValueOnce(makeRegisterResponse('05***4567'));

    const { getByTestId } = await render(<RegisterScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-firstNameAr'),    'أحمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-lastNameAr'),     'محمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-employeeNumber'), '1234567890');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-phoneNumber'),    '+966501234567');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-password'),       'SecurePass123!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'),'SecurePass123!');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-register'));
    });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith({
        pathname: '/(auth)/verify-otp',
        params: { nationalId: '1234567890', maskedPhone: '05***4567' },
      });
    });
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  // ── 3. ApiError → Alert shown, loading cleared, no navigation ─────────────

  it('shows an Alert with the ApiError message, clears loading, and does not navigate', async () => {
    const { ApiError: AE } = require('@/services/api');
    mockRegister.mockRejectedValueOnce(
      new AE('EMPLOYEE_ALREADY_EXISTS', 'National ID already registered.', 409)
    );

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    const { getByTestId } = await render(<RegisterScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-firstNameAr'),    'أحمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-lastNameAr'),     'محمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-employeeNumber'), '1234567890');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-phoneNumber'),    '+966501234567');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-password'),       'SecurePass123!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'),'SecurePass123!');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-register'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Registration Error',
        'National ID already registered.'
      );
    });

    expect(mockRouterPush).not.toHaveBeenCalled();

    // Loading must be cleared — button is no longer disabled
    const btn = getByTestId('btn-register');
    expect(btn.props.accessibilityState?.disabled).not.toBe(true);

    alertSpy.mockRestore();
  });

  // ── 4. Generic (non-ApiError) → fallback Alert message ────────────────────

  it('shows a generic fallback Alert message for non-ApiError exceptions', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Network request failed'));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    const { getByTestId } = await render(<RegisterScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-firstNameAr'),    'أحمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-lastNameAr'),     'محمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-employeeNumber'), '1234567890');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-phoneNumber'),    '+966501234567');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-password'),       'SecurePass123!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'),'SecurePass123!');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-register'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Registration Error',
        'Registration failed. Please try again.'
      );
    });

    expect(mockRouterPush).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  // ── 5. Validation: employee number not exactly 10 digits ──────────────────

  it('does not call the API when the employee number is not exactly 10 digits', async () => {
    const { getByTestId } = await render(<RegisterScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-firstNameAr'),    'أحمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-lastNameAr'),     'محمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-employeeNumber'), '12345'); // too short
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-phoneNumber'),    '+966501234567');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-password'),       'SecurePass123!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'),'SecurePass123!');
    });

    fireEvent.press(getByTestId('btn-register'));

    expect(mockRegister).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  // ── 6. Validation: password shorter than 12 chars ─────────────────────────

  it('does not call the API when the password is fewer than 12 characters', async () => {
    const { getByTestId } = await render(<RegisterScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-firstNameAr'),    'أحمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-lastNameAr'),     'محمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-employeeNumber'), '1234567890');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-phoneNumber'),    '+966501234567');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-password'),       'Short1!');  // 7 chars
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'),'Short1!');
    });

    fireEvent.press(getByTestId('btn-register'));

    expect(mockRegister).not.toHaveBeenCalled();
  });

  // ── 7. Validation: passwords do not match ─────────────────────────────────

  it('does not call the API when password and confirmPassword do not match', async () => {
    const { getByTestId } = await render(<RegisterScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-firstNameAr'),    'أحمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-lastNameAr'),     'محمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-employeeNumber'), '1234567890');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-phoneNumber'),    '+966501234567');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-password'),       'SecurePass123!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'),'DifferentPass!');
    });

    fireEvent.press(getByTestId('btn-register'));

    expect(mockRegister).not.toHaveBeenCalled();
  });

  // ── 8. Validation: first name is required ─────────────────────────────────

  it('does not call the API when the first name is empty', async () => {
    const { getByTestId } = await render(<RegisterScreen />);

    // firstNameAr intentionally left blank
    await act(async () => {
      fireEvent.changeText(getByTestId('input-lastNameAr'),     'محمد');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-employeeNumber'), '1234567890');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-phoneNumber'),    '+966501234567');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-password'),       'SecurePass123!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'),'SecurePass123!');
    });

    fireEvent.press(getByTestId('btn-register'));

    expect(mockRegister).not.toHaveBeenCalled();
  });
});
