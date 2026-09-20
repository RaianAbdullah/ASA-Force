/**
 * Integration tests for the OTP verification screen.
 *
 * Covers:
 *  - Successful OTP entry navigates to the waiting screen with nationalId param
 *  - Incomplete OTP: button is disabled and the API is never called
 *  - Missing nationalId redirects back to register
 *  - API error surfaces as an alert and clears the input
 */

import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Mocks (jest.mock is hoisted above imports by babel-jest) ──────────────────

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (...args: unknown[]) => mockReplace(...args) },
  useLocalSearchParams: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const mockVerifyOtp = jest.fn();
const mockGetStatus = jest.fn();
jest.mock('@/services/api', () => {
  class ApiError extends Error {
    code: string;
    status: number;
    constructor(code: string, message: string, status = 0) {
      super(message);
      this.name = 'ApiError';
      this.code = code;
      this.status = status;
    }
  }
  return {
    authApi: {
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
      getStatus: (...args: unknown[]) => mockGetStatus(...args),
    },
    ApiError,
  };
});

// ── Static imports (run after mocks are applied) ──────────────────────────────

import { useLocalSearchParams } from 'expo-router';
import VerifyOtpScreen from '../app/(auth)/verify-otp';

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupParams(params: Record<string, string | undefined>) {
  (useLocalSearchParams as jest.Mock).mockReturnValue(params);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VerifyOtpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Always restore real timers so leaked fake timers don't bleed into other tests
    jest.useRealTimers();
    await cleanup();
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('navigates to /waiting with nationalId after successful OTP verification', async () => {
    setupParams({ nationalId: '1234567890', maskedPhone: '05***1234' });
    mockVerifyOtp.mockResolvedValueOnce({
      success: true,
      data: { status: 'PENDING_APPROVAL', message: 'ok' },
      timestamp: new Date().toISOString(),
    });

    const { getByTestId } = await render(<VerifyOtpScreen />);

    // Flush the text-change state update so the button becomes enabled
    await act(async () => {
      fireEvent.changeText(getByTestId('input-otp'), '123456');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-verify'));
    });

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        nationalId: '1234567890',
        otpCode: '123456',
      });
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/(auth)/waiting',
        params: { nationalId: '1234567890' },
      });
    });
  });

  // ── Incomplete OTP ─────────────────────────────────────────────────────────
  // The Verify button is `disabled` when fewer than 6 digits are entered so
  // RNTL will not fire its onPress. We verify the disabled prop is set and
  // the API is never invoked.

  it('keeps the button disabled and does not call the API with fewer than 6 digits', async () => {
    setupParams({ nationalId: '1234567890' });

    const { getByTestId } = await render(<VerifyOtpScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-otp'), '123'); // 3 of 6 digits
    });

    // Button should have disabled={true}
    expect(getByTestId('btn-verify').props.accessibilityState?.disabled).toBe(true);
    // Confirm the API was not invoked
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  // ── Missing nationalId ─────────────────────────────────────────────────────

  it('redirects to /register when nationalId param is missing', async () => {
    setupParams({ nationalId: undefined });

    const { getByTestId } = await render(<VerifyOtpScreen />);

    // Enter a full OTP so the button is enabled
    await act(async () => {
      fireEvent.changeText(getByTestId('input-otp'), '999999');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-verify'));
    });

    await waitFor(() => {
      expect(mockVerifyOtp).not.toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/register');
    });
  });

  // ── Resend: double-tap guard ───────────────────────────────────────────────

  it('fires only one getStatus call when Resend is tapped twice before the first response arrives', async () => {
    setupParams({ nationalId: '1234567890' });
    jest.useFakeTimers();

    // Resolves on demand so we control when the in-flight request completes
    let resolveFirst!: () => void;
    mockGetStatus.mockImplementationOnce(
      () => new Promise<void>((res) => { resolveFirst = res; })
    );

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { getByTestId } = await render(<VerifyOtpScreen />);

    // First tap — starts the in-flight request
    await act(async () => {
      fireEvent.press(getByTestId('btn-resend'));
    });

    // Second tap while first is still in-flight — should be a no-op
    await act(async () => {
      fireEvent.press(getByTestId('btn-resend'));
    });

    // Resolve the pending request; this triggers startResendCooldown
    await act(async () => { resolveFirst(); });
    // Let the resolved promise settle
    await act(async () => { await Promise.resolve(); });

    expect(mockGetStatus).toHaveBeenCalledTimes(1);

    // Advance fake timers past the full 60 s cooldown so the interval self-clears
    await act(async () => { jest.advanceTimersByTime(61000); });
    alertSpy.mockRestore();
  });

  // ── Resend: cooldown display ───────────────────────────────────────────────

  it('shows the countdown text and disables the button after a successful resend', async () => {
    setupParams({ nationalId: '1234567890' });
    jest.useFakeTimers();
    mockGetStatus.mockResolvedValueOnce({});

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { getByTestId, getByText } = await render(<VerifyOtpScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('btn-resend'));
    });

    // Let the resolved promise settle
    await act(async () => { await Promise.resolve(); });

    // Button should now show the countdown and be disabled
    expect(getByText('Resend in 60s')).toBeTruthy();
    expect(getByTestId('btn-resend').props.accessibilityState?.disabled).toBe(true);

    // Advance fake timers past the full 60 s cooldown so the interval self-clears
    await act(async () => { jest.advanceTimersByTime(61000); });
    alertSpy.mockRestore();
  });

  // ── Resend: API error re-enables button ────────────────────────────────────

  it('shows an alert and re-enables the Resend button when the resend API call fails', async () => {
    setupParams({ nationalId: '1234567890' });
    mockGetStatus.mockRejectedValueOnce(new Error('Network error'));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { getByTestId, getByText } = await render(<VerifyOtpScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('btn-resend'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Resend Failed', 'Could not resend the code. Please try again.');
    });

    // Button should be re-enabled (no cooldown, no in-flight)
    expect(getByTestId('btn-resend').props.accessibilityState?.disabled).toBe(false);
    expect(getByText('Resend')).toBeTruthy();

    alertSpy.mockRestore();
  });

  // ── API error ─────────────────────────────────────────────────────────────

  it('shows an alert with the API error message and clears the input on failure', async () => {
    setupParams({ nationalId: '1234567890' });

    const { ApiError: AE } = require('@/services/api');
    mockVerifyOtp.mockRejectedValueOnce(
      new AE('OTP_INVALID', 'Invalid or expired OTP', 400)
    );

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { getByTestId } = await render(<VerifyOtpScreen />);

    await act(async () => {
      fireEvent.changeText(getByTestId('input-otp'), '000000');
    });

    await act(async () => {
      fireEvent.press(getByTestId('btn-verify'));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Verification Error', 'Invalid or expired OTP');
      expect(getByTestId('input-otp').props.value).toBe('');
    });

    alertSpy.mockRestore();
  });
});
