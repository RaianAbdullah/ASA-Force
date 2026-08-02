/**
 * Integration tests for the Waiting (approval pending) screen.
 *
 * Covers:
 *  - Waiting screen mounts and makes an initial status fetch
 *  - ACTIVE status from the API triggers navigation to login
 *  - API error on status fetch shows an inline error message
 *  - Missing nationalId param is handled gracefully (no API call, no crash)
 *  - Manual "Check Status" button triggers an explicit status fetch
 *  - Background poll fires every 30 seconds (tested with fake timers)
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
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Notifications/Device: treat as web simulator so push-token path is skipped
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExpoToken[xxx]' }),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-device', () => ({
  isDevice: false,
}));

const mockGetStatus = jest.fn();
const mockRegisterPendingToken = jest.fn();

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
      getStatus: (...args: unknown[]) => mockGetStatus(...args),
    },
    notificationApi: {
      registerPendingToken: (...args: unknown[]) => mockRegisterPendingToken(...args),
    },
    ApiError,
  };
});

// ── Static imports ─────────────────────────────────────────────────────────

import { useLocalSearchParams } from 'expo-router';
import WaitingScreen from '../app/(auth)/waiting';

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupParams(params: Record<string, string | undefined>) {
  (useLocalSearchParams as jest.Mock).mockReturnValue(params);
}

function statusResponse(status: string) {
  return {
    success: true,
    data: { status, message: 'ok' },
    timestamp: new Date().toISOString(),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WaitingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  // ── Initial render with pending status ────────────────────────────────────

  it('renders the waiting screen and makes an initial status fetch', async () => {
    setupParams({ nationalId: '1234567890' });
    mockGetStatus.mockResolvedValue(statusResponse('PENDING_APPROVAL'));

    const { getByText } = await render(<WaitingScreen />);

    // Heading is visible immediately
    expect(getByText('Application Received')).toBeTruthy();

    await waitFor(() => {
      expect(mockGetStatus).toHaveBeenCalledWith('1234567890');
    });
  });

  // ── ACTIVE status triggers navigation to login ────────────────────────────

  it('navigates to login when status poll returns ACTIVE', async () => {
    setupParams({ nationalId: '1234567890' });
    mockGetStatus.mockResolvedValue(statusResponse('ACTIVE'));

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(
      (_title, _msg, buttons) => {
        // Auto-confirm the "Sign In" button
        buttons?.[0]?.onPress?.();
      }
    );

    await render(<WaitingScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
    });

    alertSpy.mockRestore();
  });

  // ── API error shows inline error message ─────────────────────────────────

  it('shows an inline error when the status fetch fails', async () => {
    setupParams({ nationalId: '1234567890' });

    const { ApiError: AE } = require('@/services/api');
    // Initial silent fetch succeeds so the screen mounts cleanly
    mockGetStatus.mockResolvedValueOnce(statusResponse('PENDING_APPROVAL'));
    // Subsequent explicit fetch (manual button press) fails
    mockGetStatus.mockRejectedValueOnce(
      new AE('SERVER_ERROR', 'Could not reach the server. Please try again.', 500)
    );

    const { findByText, getByText } = await render(<WaitingScreen />);

    // Wait for the initial silent fetch
    await waitFor(() => expect(mockGetStatus).toHaveBeenCalledTimes(1));

    // Trigger a visible fetch via the "Check Status" button
    await act(async () => {
      fireEvent.press(getByText(/Check Status/));
    });

    const errorMsg = await findByText('Could not reach the server. Please try again.');
    expect(errorMsg).toBeTruthy();
  });

  // ── Missing nationalId is handled gracefully ──────────────────────────────

  it('does not call the API and does not crash when nationalId is missing', async () => {
    setupParams({ nationalId: undefined });

    const { getByText } = await render(<WaitingScreen />);

    // Give effects time to fire
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockGetStatus).not.toHaveBeenCalled();
    // Screen still renders heading correctly
    expect(getByText('Application Received')).toBeTruthy();
  });

  // ── Manual "Check Status" button ─────────────────────────────────────────

  it('calls the status API when the "Check Status" button is pressed', async () => {
    setupParams({ nationalId: '1234567890' });
    mockGetStatus.mockResolvedValue(statusResponse('PENDING_APPROVAL'));

    const { getByText } = await render(<WaitingScreen />);

    // Wait for initial silent fetch
    await waitFor(() => expect(mockGetStatus).toHaveBeenCalledTimes(1));

    await act(async () => {
      fireEvent.press(getByText(/Check Status/));
    });

    await waitFor(() => {
      expect(mockGetStatus).toHaveBeenCalledTimes(2);
    });
  });

  // ── 30-second poll fires automatically ───────────────────────────────────
  // Uses fake timers to control setInterval without waiting 30 real seconds.

  it('polls the status API every 30 seconds automatically', async () => {
    // Set up fake timers BEFORE rendering so setInterval is mocked
    jest.useFakeTimers();

    try {
      setupParams({ nationalId: '1234567890' });
      // Use mockImplementation so each call resolves immediately via Promise
      mockGetStatus.mockImplementation(() => Promise.resolve(statusResponse('PENDING_APPROVAL')));

      await render(<WaitingScreen />);

      // The initial fetchStatus(true) fires immediately in useEffect.
      // Flush it by advancing microtasks (fake timers don't block Promises).
      await act(async () => {
        await Promise.resolve();
      });

      const callsAfterMount = mockGetStatus.mock.calls.length;
      expect(callsAfterMount).toBeGreaterThanOrEqual(1);

      // Advance 30 s → next poll fires via setInterval
      await act(async () => {
        jest.advanceTimersByTime(30_000);
        await Promise.resolve();
      });

      expect(mockGetStatus.mock.calls.length).toBeGreaterThan(callsAfterMount);
    } finally {
      jest.useRealTimers();
    }
  });
});
