/**
 * Integration smoke test: full password-reset journey
 *
 * Simulates the complete user flow across both screens:
 *
 *  Happy path
 *  ─────────────────────────────────────────────────────────────
 *  1. ForgotPasswordScreen: enter national ID → API called → confirmation shown
 *  2. Confirmation screen:  "Enter Reset Code" button → router.push('/(auth)/reset-password')
 *  3. ResetPasswordScreen:  enter token + new password → API called → success Alert shown
 *  4. Alert "Sign In" button → router.replace('/(auth)/login')
 *
 *  Failure path
 *  ─────────────────────────────────────────────────────────────
 *  5. ResetPasswordScreen with bad token → ApiError → inline error shown, no navigation
 *  6. ResetPasswordScreen with network failure → fallback error shown, no navigation
 *
 * Why component-level rather than a full Expo router harness?
 * expo-router's file-system router cannot be instantiated in Jest without the full
 * native bundler. We therefore simulate screen transitions by rendering each screen
 * in the order the navigator would, verifying that:
 *   - the correct router calls are made at every hand-off point
 *   - the UI rendered after a hand-off is exactly what the next screen shows
 * This is equivalent to what a react-navigation NavigationContainer integration
 * test would assert, without requiring the native environment.
 *
 * Note on act() usage:
 *   React 19 batches state updates. Each fireEvent.changeText call queues a state
 *   update that must be flushed (via act()) before subsequent handlers can read the
 *   updated value. Where multiple inputs are filled before a button press, their
 *   changeText events are batched into a SINGLE act() to reduce the total number of
 *   act scopes (and the resulting overlapping-act warnings that @testing-library/
 *   react-native v14 + React 19 emit when fireEvent is wrapped in act).
 *   The press that triggers the async API call is always in its own act() so that
 *   the resolved-promise microtasks are fully flushed before assertions run.
 */

import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ── Shared router mock ────────────────────────────────────────────────────────

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

// ── API mocks ─────────────────────────────────────────────────────────────────

const mockForgotPassword = jest.fn();
const mockResetPassword  = jest.fn();

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
      resetPassword:  (...args: unknown[]) => mockResetPassword(...args),
    },
    ApiError,
  };
});

// ── Screen imports (after mocks) ──────────────────────────────────────────────

import ForgotPasswordScreen from '../app/(auth)/forgot-password';
import ResetPasswordScreen  from '../app/(auth)/reset-password';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Password-reset journey (integration smoke test)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 1 & 2 — ForgotPassword screen → confirmation → navigate to reset-password
  // ────────────────────────────────────────────────────────────────────────────

  describe('Step 1-2: ForgotPassword screen', () => {
    it('calls forgotPassword API with the correct national ID', async () => {
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

    it('shows the confirmation screen after the API responds', async () => {
      mockForgotPassword.mockResolvedValueOnce({ success: true, timestamp: '' });

      const { getByTestId, queryByTestId, getByText } = await render(<ForgotPasswordScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('input-nationalId'), '1234567890');
      });
      await act(async () => {
        fireEvent.press(getByTestId('btn-submit'));
      });

      await waitFor(() => expect(getByText('Reset Code Sent')).toBeTruthy());

      // The entry form is gone
      expect(queryByTestId('btn-submit')).toBeNull();
      // The hand-off button to reset-password is visible
      expect(getByTestId('btn-enter-reset-code')).toBeTruthy();
    });

    it('navigates to /(auth)/reset-password when "Enter Reset Code" is pressed', async () => {
      mockForgotPassword.mockResolvedValueOnce({ success: true, timestamp: '' });

      const { getByTestId } = await render(<ForgotPasswordScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('input-nationalId'), '1234567890');
      });
      await act(async () => {
        fireEvent.press(getByTestId('btn-submit'));
      });

      await waitFor(() => expect(getByTestId('btn-enter-reset-code')).toBeTruthy());

      fireEvent.press(getByTestId('btn-enter-reset-code'));

      // ── Route transition verified ──────────────────────────────────────────
      expect(mockRouterPush).toHaveBeenCalledWith('/(auth)/reset-password');
      expect(mockRouterPush).toHaveBeenCalledTimes(1);
    });

    it('still shows the confirmation screen even when the API fails (account-enumeration protection)', async () => {
      const { ApiError: AE } = require('@/services/api');
      mockForgotPassword.mockRejectedValueOnce(new AE('NOT_FOUND', 'Account not found.', 404));

      const { getByTestId, getByText } = await render(<ForgotPasswordScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('input-nationalId'), '9999999999');
      });
      await act(async () => {
        fireEvent.press(getByTestId('btn-submit'));
      });

      await waitFor(() => expect(getByText('Reset Code Sent')).toBeTruthy());
      // Navigation hand-off button is still available — no dead end
      expect(getByTestId('btn-enter-reset-code')).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 3 & 4 — ResetPassword screen → success Alert → navigate to login
  // ────────────────────────────────────────────────────────────────────────────

  describe('Step 3-4: ResetPassword screen (happy path)', () => {
    it('calls resetPassword API with the trimmed token and new password', async () => {
      mockResetPassword.mockResolvedValueOnce({ success: true, timestamp: '' });
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

      const { getByTestId } = await render(<ResetPasswordScreen />);

      // Batch all input changes into one act so React flushes them together
      // before canSubmit is evaluated on the subsequent press.
      await act(async () => {
        fireEvent.changeText(getByTestId('input-resetToken'), '  my-reset-token  ');
        fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure123!');
        fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure123!');
      });
      await act(async () => {
        fireEvent.press(getByTestId('btn-reset'));
      });

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledTimes(1);
        expect(mockResetPassword).toHaveBeenCalledWith('my-reset-token', 'NewSecure123!');
      });

      alertSpy.mockRestore();
    });

    it('shows a success Alert with the correct title, message, and Sign In button', async () => {
      mockResetPassword.mockResolvedValueOnce({ success: true, timestamp: '' });
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

      const { getByTestId } = await render(<ResetPasswordScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('input-resetToken'), 'abc-reset-token-123');
        fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure123!');
        fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure123!');
      });
      await act(async () => {
        fireEvent.press(getByTestId('btn-reset'));
      });

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith(
          'Password Reset',
          'Your password has been reset successfully. Please sign in with your new password.',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Sign In' }),
          ])
        )
      );

      alertSpy.mockRestore();
    });

    it('navigates to /(auth)/login when the Alert "Sign In" button is pressed', async () => {
      mockResetPassword.mockResolvedValueOnce({ success: true, timestamp: '' });

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
        fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure123!');
        fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure123!');
      });
      await act(async () => {
        fireEvent.press(getByTestId('btn-reset'));
      });

      await waitFor(() => expect(alertSpy).toHaveBeenCalled());

      // Simulate the user tapping "Sign In" inside the Alert
      await act(async () => { signInCallback?.(); });

      // ── Route transition verified ──────────────────────────────────────────
      expect(mockRouterReplace).toHaveBeenCalledWith('/(auth)/login');
      expect(mockRouterReplace).toHaveBeenCalledTimes(1);
      // Must use replace (not push) so the user cannot navigate back to the reset screen
      expect(mockRouterPush).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 5 & 6 — Failure path: bad token → stays on reset-password with inline error
  // ────────────────────────────────────────────────────────────────────────────

  describe('Step 5-6: ResetPassword screen (failure path)', () => {
    it('stays on the reset-password screen and shows an inline error on a bad token', async () => {
      const { ApiError: AE } = require('@/services/api');
      mockResetPassword.mockRejectedValueOnce(
        new AE('INVALID_TOKEN', 'Reset token is invalid or expired.', 400)
      );

      const { getByTestId, getByText } = await render(<ResetPasswordScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('input-resetToken'), 'bad-token-value');
        fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure123!');
        fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure123!');
      });
      await act(async () => {
        fireEvent.press(getByTestId('btn-reset'));
      });

      // Inline error is displayed — user has not left the screen
      await waitFor(() =>
        expect(getByText('Reset token is invalid or expired.')).toBeTruthy()
      );

      // No navigation happened — user stays on reset-password to correct the token
      expect(mockRouterReplace).not.toHaveBeenCalled();
      expect(mockRouterPush).not.toHaveBeenCalled();

      // Loading is cleared — the submit button is interactive again
      const btn = getByTestId('btn-reset');
      expect(btn.props.accessibilityState?.disabled).not.toBe(true);
    });

    it('stays on reset-password with a fallback error when a network failure occurs', async () => {
      mockResetPassword.mockRejectedValueOnce(new Error('Network request failed'));

      const { getByTestId, getByText } = await render(<ResetPasswordScreen />);

      await act(async () => {
        fireEvent.changeText(getByTestId('input-resetToken'), 'any-token');
        fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure123!');
        fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure123!');
      });
      await act(async () => {
        fireEvent.press(getByTestId('btn-reset'));
      });

      await waitFor(() =>
        expect(getByText('Reset failed. Please request a new code.')).toBeTruthy()
      );

      expect(mockRouterReplace).not.toHaveBeenCalled();
      expect(mockRouterPush).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Full journey in a single test (smoke-test overview)
  // ────────────────────────────────────────────────────────────────────────────

  describe('Full happy-path journey (end-to-end smoke)', () => {
    it('completes the entire password-reset flow without dead ends', async () => {
      mockForgotPassword.mockResolvedValueOnce({ success: true, timestamp: '' });
      mockResetPassword.mockResolvedValueOnce({ success: true, timestamp: '' });

      let signInCb: (() => void) | undefined;
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(
        (_title, _msg, buttons) => {
          const btns = buttons as Array<{ text: string; onPress?: () => void }>;
          signInCb = btns?.find(b => b.text === 'Sign In')?.onPress;
        }
      );

      // A thin navigator wrapper that swaps between the two auth screens.
      // Using a single render tree avoids the concurrent-root async state
      // interference that occurs when two render() calls are active together.
      let switchToReset!: () => void;
      function JourneyWrapper() {
        const [screen, setScreen] = React.useState<'forgot' | 'reset'>('forgot');
        switchToReset = () => setScreen('reset');
        return screen === 'forgot'
          ? <ForgotPasswordScreen />
          : <ResetPasswordScreen />;
      }

      const { getByTestId, getByText } = await render(<JourneyWrapper />);

      // ── Phase 1: ForgotPassword screen ────────────────────────────────────
      await act(async () => {
        fireEvent.changeText(getByTestId('input-nationalId'), '1234567890');
      });
      await act(async () => {
        fireEvent.press(getByTestId('btn-submit'));
      });

      await waitFor(() => expect(getByText('Reset Code Sent')).toBeTruthy());

      // Tapping "Enter Reset Code" calls router.push — route transition verified
      fireEvent.press(getByTestId('btn-enter-reset-code'));
      expect(mockRouterPush).toHaveBeenCalledWith('/(auth)/reset-password');

      // ── Navigator transition to ResetPassword screen ───────────────────────
      await act(async () => { switchToReset(); });

      // ── Phase 2: ResetPassword screen ─────────────────────────────────────
      // Batch all input changes into one act, then press separately so that
      // canSubmit evaluates against the fully-committed state.
      await act(async () => {
        fireEvent.changeText(getByTestId('input-resetToken'), 'valid-reset-token');
        fireEvent.changeText(getByTestId('input-newPassword'), 'NewSecure123!');
        fireEvent.changeText(getByTestId('input-confirmPassword'), 'NewSecure123!');
      });

      // Confirm canSubmit is satisfied (button enabled) before pressing
      await waitFor(() => {
        const btn = getByTestId('btn-reset');
        expect(btn.props.accessibilityState?.disabled).not.toBe(true);
      });

      await act(async () => {
        fireEvent.press(getByTestId('btn-reset'));
      });

      // API was invoked — canSubmit was satisfied
      await waitFor(() => expect(mockResetPassword).toHaveBeenCalledTimes(1));

      // Success Alert fires
      await waitFor(() => expect(alertSpy).toHaveBeenCalled());

      // Tapping "Sign In" calls router.replace — final route transition verified
      await act(async () => { signInCb?.(); });
      expect(mockRouterReplace).toHaveBeenCalledWith('/(auth)/login');
      // replace (not push) ensures the user cannot navigate back to the reset screen
      expect(mockRouterPush).toHaveBeenCalledTimes(1); // only the phase-1 call

      alertSpy.mockRestore();
    });
  });
});
