/**
 * Component tests for app/(auth)/change-password.tsx
 *
 * Covers:
 *  — Correct currentPassword + newPassword forwarded to authApi.changePassword
 *  — Success + EMPLOYEE role → router.replace('/(tabs)')
 *  — Success + SYSTEM_ADMIN role → router.replace('/(admin)')
 *  — Success + MAIN_MANAGER role → router.replace('/(admin)')
 *  — ApiError → Alert shown with error message, loading cleared, no navigation
 *  — Generic (non-ApiError) → Alert shown with fallback message, no navigation
 *  — Validation: empty currentPassword → no API call
 *  — Validation: new password shorter than 8 chars → no API call
 *  — Validation: passwords do not match → no API call
 */

import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Mocks (jest.mock calls are hoisted; variables must start with "mock") ──────

const mockRouterReplace = jest.fn();
const mockRouterPush    = jest.fn();
const mockRouterBack    = jest.fn();

// useLocalSearchParams must be configurable per-test; default to EMPLOYEE role
let mockSearchParams: Record<string, string> = { role: 'EMPLOYEE' };

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
    push:    (...args: unknown[]) => mockRouterPush(...args),
    back:    (...args: unknown[]) => mockRouterBack(...args),
  },
  useLocalSearchParams: () => mockSearchParams,
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

const mockChangePassword = jest.fn();

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
      changePassword: (...args: unknown[]) => mockChangePassword(...args),
    },
    ApiError,
  };
});

// ── Static imports (after mocks) ──────────────────────────────────────────────

import ChangePasswordScreen from '../app/(auth)/change-password';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChangePasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = { role: 'EMPLOYEE' };
  });

  afterEach(async () => {
    await cleanup();
  });

  // ── 1. Correct args forwarded to authApi.changePassword ───────────────────

  it('calls authApi.changePassword with currentPassword and newPassword', async () => {
    mockChangePassword.mockResolvedValueOnce({ success: true, timestamp: '' });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    const { getByTestId } = await render(<ChangePasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-currentPassword'), 'TempPass1!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-changePassword'));
    });

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledTimes(1);
      expect(mockChangePassword).toHaveBeenCalledWith('TempPass1!', 'NewSecure99!');
    });

    alertSpy.mockRestore();
  });

  // ── 2. Success + EMPLOYEE role → /(tabs) ──────────────────────────────────

  it('navigates to /(tabs) on success when role is EMPLOYEE', async () => {
    mockSearchParams = { role: 'EMPLOYEE' };
    mockChangePassword.mockResolvedValueOnce({ success: true, timestamp: '' });

    const { getByTestId } = await render(<ChangePasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-currentPassword'), 'TempPass1!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-changePassword'));
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(tabs)');
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  // ── 3. Success + SYSTEM_ADMIN role → /(admin) ─────────────────────────────

  it('navigates to /(admin) on success when role is SYSTEM_ADMIN', async () => {
    mockSearchParams = { role: 'SYSTEM_ADMIN' };
    mockChangePassword.mockResolvedValueOnce({ success: true, timestamp: '' });

    const { getByTestId } = await render(<ChangePasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-currentPassword'), 'TempPass1!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-changePassword'));
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(admin)');
    });
  });

  // ── 4. Success + MAIN_MANAGER role → /(admin) ────────────────────────────

  it('navigates to /(admin) on success when role is MAIN_MANAGER', async () => {
    mockSearchParams = { role: 'MAIN_MANAGER' };
    mockChangePassword.mockResolvedValueOnce({ success: true, timestamp: '' });

    const { getByTestId } = await render(<ChangePasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-currentPassword'), 'TempPass1!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-changePassword'));
    });

    await waitFor(() => {
      expect(mockRouterReplace).toHaveBeenCalledWith('/(admin)');
    });
  });

  // ── 5. ApiError → Alert shown with error message, no navigation ───────────

  it('shows an Alert with the ApiError message on API failure and clears loading', async () => {
    const { ApiError: AE } = require('@/services/api');
    mockChangePassword.mockRejectedValueOnce(
      new AE('INVALID_PASSWORD', 'Current password is incorrect.', 400)
    );

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    const { getByTestId } = await render(<ChangePasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-currentPassword'), 'WrongTemp1!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-changePassword'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Current password is incorrect.');
    });

    expect(mockRouterReplace).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();

    // Loading cleared — button re-enabled
    const btn = getByTestId('btn-changePassword');
    expect(btn.props.accessibilityState?.disabled).not.toBe(true);

    alertSpy.mockRestore();
  });

  // ── 6. Generic error → fallback Alert, no navigation ─────────────────────

  it('shows a fallback Alert message for non-ApiError exceptions and clears loading', async () => {
    mockChangePassword.mockRejectedValueOnce(new Error('Network request failed'));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    const { getByTestId } = await render(<ChangePasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-currentPassword'), 'TempPass1!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-changePassword'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error', 'Failed to change password. Try again.');
    });

    expect(mockRouterReplace).not.toHaveBeenCalled();

    const btn = getByTestId('btn-changePassword');
    expect(btn.props.accessibilityState?.disabled).not.toBe(true);

    alertSpy.mockRestore();
  });

  // ── 7. Validation: empty currentPassword → no API call ───────────────────

  it('does not call the API when currentPassword is empty', async () => {
    const { getByTestId } = await render(<ChangePasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure99!');
    });

    fireEvent.press(getByTestId('btn-changePassword'));

    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  // ── 8. Validation: new password shorter than 8 chars → no API call ────────

  it('does not call the API when the new password is fewer than 8 characters', async () => {
    const { getByTestId } = await render(<ChangePasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-currentPassword'), 'TempPass1!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'Short1!');   // 7 chars
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'Short1!');
    });

    fireEvent.press(getByTestId('btn-changePassword'));

    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  // ── 9. Validation: passwords do not match → no API call ──────────────────

  it('does not call the API when newPassword and confirmPassword do not match', async () => {
    const { getByTestId } = await render(<ChangePasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-currentPassword'), 'TempPass1!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure99!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'DifferentPass!');
    });

    fireEvent.press(getByTestId('btn-changePassword'));

    expect(mockChangePassword).not.toHaveBeenCalled();
  });
});
