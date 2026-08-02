/**
 * Component tests for app/(auth)/forgot-password.tsx
 *
 * Covers:
 *  — Correct nationalId forwarded to authApi.forgotPassword
 *  — Success → confirmation screen shown (setSent(true))
 *  — API error → confirmation screen shown anyway (account enumeration protection)
 *  — Confirmation screen: "Enter Reset Code" button navigates to /(auth)/reset-password
 *  — Validation: nationalId not exactly 10 digits → no API call
 */

import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';

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

const mockForgotPassword = jest.fn();

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
      forgotPassword: (...args: unknown[]) => mockForgotPassword(...args),
    },
    ApiError,
  };
});

// ── Static imports ─────────────────────────────────────────────────────────────

import ForgotPasswordScreen from '../app/(auth)/forgot-password';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  // ── 1. Correct nationalId forwarded ──────────────────────────────────────────

  it('calls authApi.forgotPassword with the trimmed nationalId', async () => {
    mockForgotPassword.mockResolvedValueOnce({ success: true, timestamp: '' });

    const { getByTestId } = await render(<ForgotPasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-nationalId'), '1234567890');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-submit'));
    });

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledTimes(1);
      expect(mockForgotPassword).toHaveBeenCalledWith('1234567890');
    });
  });

  // ── 2. Success → confirmation screen shown ────────────────────────────────────

  it('shows the confirmation screen after a successful API call', async () => {
    mockForgotPassword.mockResolvedValueOnce({ success: true, timestamp: '' });

    const { getByTestId, queryByTestId, getByText } = await render(<ForgotPasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-nationalId'), '1234567890');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-submit'));
    });

    await waitFor(() => {
      expect(getByText('Reset Code Sent')).toBeTruthy();
    });

    // Submit button should no longer be visible
    expect(queryByTestId('btn-submit')).toBeNull();
    // Confirmation action button should be visible
    expect(getByTestId('btn-enter-reset-code')).toBeTruthy();
  });

  // ── 3. API error → still shows confirmation (account-enumeration protection) ──

  it('shows the confirmation screen even when the API call fails (account enumeration protection)', async () => {
    const { ApiError: AE } = require('@/services/api');
    mockForgotPassword.mockRejectedValueOnce(
      new AE('NOT_FOUND', 'Account not found.', 404)
    );

    const { getByTestId, queryByTestId, getByText } = await render(<ForgotPasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-nationalId'), '9999999999');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-submit'));
    });

    await waitFor(() => {
      expect(getByText('Reset Code Sent')).toBeTruthy();
    });

    expect(queryByTestId('btn-submit')).toBeNull();
  });

  // ── 4. Confirmation screen → "Enter Reset Code" navigates to reset-password ───

  it('navigates to /(auth)/reset-password when "Enter Reset Code" is pressed', async () => {
    mockForgotPassword.mockResolvedValueOnce({ success: true, timestamp: '' });

    const { getByTestId } = await render(<ForgotPasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-nationalId'), '1234567890');
    });
    await act(async () => {
      fireEvent.press(getByTestId('btn-submit'));
    });

    await waitFor(() => {
      expect(getByTestId('btn-enter-reset-code')).toBeTruthy();
    });

    fireEvent.press(getByTestId('btn-enter-reset-code'));

    expect(mockRouterPush).toHaveBeenCalledWith('/(auth)/reset-password');
  });

  // ── 5. Validation: nationalId shorter than 10 digits → no API call ───────────

  it('does not call the API when the nationalId is not exactly 10 digits', async () => {
    const { getByTestId } = await render(<ForgotPasswordScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-nationalId'), '12345'); // too short
    });

    fireEvent.press(getByTestId('btn-submit'));

    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  // ── 6. Validation: empty nationalId → button disabled, no API call ────────────

  it('does not call the API when nationalId is empty', async () => {
    const { getByTestId } = await render(<ForgotPasswordScreen />);

    fireEvent.press(getByTestId('btn-submit'));

    expect(mockForgotPassword).not.toHaveBeenCalled();
  });
});
