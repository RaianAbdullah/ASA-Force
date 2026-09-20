/**
 * Component tests for app/(auth)/reset-password.tsx
 *
 * Covers:
 *  — Correct resetToken + newPassword forwarded to authApi.resetPassword
 *  — Success → Alert shown with correct title/message/button; "Sign In" onPress
 *    navigates to /(auth)/login via router.replace
 *  — ApiError → inline error message shown, loading cleared, no navigation
 *  — Generic (non-ApiError) → fallback inline error shown, loading cleared, no navigation
 *  — Validation: empty resetToken → no API call
 *  — Validation: password shorter than 8 chars → no API call
 *  — Validation: passwords do not match → no API call
 */

import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Mocks ─────────────────────────────────────────────────────────────────────

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

const mockResetPassword = jest.fn();

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
      resetPassword: (...args: unknown[]) => mockResetPassword(...args),
    },
    ApiError,
  };
});

// ── Static imports ─────────────────────────────────────────────────────────────

import ResetPasswordScreen from '../app/(auth)/reset-password';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  // ── 1. Correct args forwarded to authApi.resetPassword ───────────────────────

  it('calls authApi.resetPassword with the trimmed resetToken and newPassword', async () => {
    mockResetPassword.mockResolvedValueOnce({ success: true, timestamp: '' });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    const { getByTestId } = await render(<ResetPasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-resetToken'), '  my-token-xyz  ');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'SolidPass99!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'SolidPass99!');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-reset'));
    });

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledTimes(1);
      expect(mockResetPassword).toHaveBeenCalledWith('my-token-xyz', 'SolidPass99!');
    });

    alertSpy.mockRestore();
  });

  // ── 2. Success → Alert shown, "Sign In" navigates to login ──────────────────

  it('shows a success Alert on success and its Sign In button navigates to /(auth)/login', async () => {
    mockResetPassword.mockResolvedValueOnce({ success: true, timestamp: '' });

    // Capture Alert.alert and the Sign-In button's onPress callback
    let signInCallback: (() => void) | undefined;
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(
      (_title, _msg, buttons) => {
        const btns = buttons as Array<{ text: string; onPress?: () => void }>;
        signInCallback = btns?.find(b => b.text === 'Sign In')?.onPress;
      }
    );

    const { getByTestId } = await render(<ResetPasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-resetToken'), 'abc-reset-token-123');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure123!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure123!');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-reset'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Password Reset',
        'Your password has been reset successfully. Please sign in with your new password.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Sign In' }),
        ])
      );
    });

    // Simulate the user pressing "Sign In" inside the Alert
    await act(async () => {
      signInCallback?.();
    });

    expect(mockRouterReplace).toHaveBeenCalledWith('/(auth)/login');
    expect(mockRouterPush).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  // ── 3. ApiError → inline error shown, loading cleared, no navigation ────────

  it('shows the ApiError message inline and clears loading on API failure', async () => {
    const { ApiError: AE } = require('@/services/api');
    mockResetPassword.mockRejectedValueOnce(
      new AE('INVALID_TOKEN', 'Reset token is invalid or expired.', 400)
    );

    const { getByTestId, getByText } = await render(<ResetPasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-resetToken'), 'bad-token');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure123!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure123!');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-reset'));
    });

    await waitFor(() => {
      expect(getByText('Reset token is invalid or expired.')).toBeTruthy();
    });

    expect(mockRouterReplace).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();

    // Loading must be cleared — button is re-enabled
    const btn = getByTestId('btn-reset');
    expect(btn.props.accessibilityState?.disabled).not.toBe(true);
  });

  // ── 4. Generic error → fallback inline error shown, loading cleared ──────────

  it('shows a fallback error message for non-ApiError exceptions', async () => {
    mockResetPassword.mockRejectedValueOnce(new Error('Network request failed'));

    const { getByTestId, getByText } = await render(<ResetPasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-resetToken'), 'some-token');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure123!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure123!');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-reset'));
    });

    await waitFor(() => {
      expect(getByText('Reset failed. Please request a new code.')).toBeTruthy();
    });

    expect(mockRouterReplace).not.toHaveBeenCalled();

    const btn = getByTestId('btn-reset');
    expect(btn.props.accessibilityState?.disabled).not.toBe(true);
  });

  // ── 5. Validation: empty resetToken → button disabled, no API call ───────────

  it('does not call the API when the reset token is empty', async () => {
    const { getByTestId } = await render(<ResetPasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'SolidPass99!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'SolidPass99!');
    });

    fireEvent.press(getByTestId('btn-reset'));

    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  // ── 6. Validation: password shorter than 8 chars → no API call ──────────────

  it('does not call the API when the new password is fewer than 8 characters', async () => {
    const { getByTestId } = await render(<ResetPasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-resetToken'), 'valid-token');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'Short1!');   // 7 chars
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'Short1!');
    });

    fireEvent.press(getByTestId('btn-reset'));

    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  // ── 7. Validation: passwords do not match → no API call ─────────────────────

  it('does not call the API when newPassword and confirmPassword do not match', async () => {
    const { getByTestId } = await render(<ResetPasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-resetToken'), 'valid-token');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-newPassword'), 'SolidPass99!');
    });
    await act(async () => {
      fireEvent.changeText(getByTestId('input-confirmPassword'), 'DifferentPass!');
    });

    fireEvent.press(getByTestId('btn-reset'));

    expect(mockResetPassword).not.toHaveBeenCalled();
  });
});
