/**
 * Integration tests for the Employee Home Screen — attendance check-in / check-out.
 *
 * Covers:
 *  - Renders the Check-In button when canCheckIn is true
 *  - Successful check-in within geofence: confirmation → API called → query invalidated
 *  - Check-in outside geofence: API error surfaces in an Alert (not silent)
 *  - bypassGeofence / geofenceOverride: notice shown when today.geofenceOverride = true
 *  - Location permission denied: actionable message shown in Alert
 *  - API timeout / network error: error surfaces in Alert (button not stuck in spinner)
 *  - Check-out after check-in: confirmation → API called → query invalidated
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
  notificationAsync: jest.fn(),
  impactAsync:       jest.fn(),
  NotificationFeedbackType: { Error: 'error', Success: 'success' },
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// ── react-query mock ─────────────────────────────────────────────────────────
// mockQueryData / mockMutationImpl are module-level refs updated per test.
// The jest.mock factory IS allowed to reference names starting with "mock".

const mockInvalidateQueries = jest.fn();

// Mutable refs so individual tests can set the desired data without re-mocking.
const mockQueryState = { data: null as unknown };

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(() => ({ invalidateQueries: mockInvalidateQueries })),

  /** Synchronously returns whatever mockQueryState.data is set to. */
  useQuery: jest.fn((_opts: unknown) => ({
    data:         mockQueryState.data,
    isLoading:    false,
    isRefetching: false,
    refetch:      jest.fn(),
  })),

  /**
   * useMutation stores the callbacks provided by the component and exposes a
   * `mutate` function that actually calls mutationFn → onSuccess/onError.
   * This lets us exercise the real mutation logic with mocked services.
   */
  useMutation: jest.fn((opts: any) => {
    const mutate = jest.fn(async () => {
      try {
        const result = await opts.mutationFn();
        await opts.onSuccess?.(result);
      } catch (err) {
        await opts.onError?.(err);
      }
    });
    return { mutate, isPending: false };
  }),
}));

// ── API service ───────────────────────────────────────────────────────────────

const mockCheckIn  = jest.fn();
const mockCheckOut = jest.fn();
const mockGetToday = jest.fn();
const mockLogout   = jest.fn();

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
    attendanceApi: {
      checkIn:  (...a: unknown[]) => mockCheckIn(...a),
      checkOut: (...a: unknown[]) => mockCheckOut(...a),
      getToday: (...a: unknown[]) => mockGetToday(...a),
    },
    authApi: {
      logout: (...a: unknown[]) => mockLogout(...a),
    },
    ApiError,
  };
});

// ── Location service ──────────────────────────────────────────────────────────

const mockGetCurrentLocation = jest.fn();
jest.mock('@/services/location', () => ({
  getCurrentLocation: (...a: unknown[]) => mockGetCurrentLocation(...a),
}));

// ── Auth service ──────────────────────────────────────────────────────────────

const mockLoadSession  = jest.fn();
const mockClearSession = jest.fn();
jest.mock('@/services/auth', () => ({
  loadSession:  (...a: unknown[]) => mockLoadSession(...a),
  clearSession: (...a: unknown[]) => mockClearSession(...a),
}));

// ── Static imports (run after mocks are hoisted) ──────────────────────────────

import HomeScreen from '../app/(tabs)/index';

// ── Helpers ───────────────────────────────────────────────────────────────────

const EMPLOYEE_SESSION = {
  token:        'tok',
  refreshToken: 'rtok',
  employeeId:   'emp-1',
  role:         'EMPLOYEE',
  nameAr:       'أحمد',
  status:       'ACTIVE',
};

function todayApiResponse(overrides: Record<string, unknown> = {}) {
  return {
    success: true,
    data: {
      attendanceDate:   '2026-07-20',
      status:           'ABSENT',
      minutesLate:      0,
      geofenceOverride: false,
      canCheckIn:       true,
      canCheckOut:      false,
      ...overrides,
    },
    timestamp: new Date().toISOString(),
  };
}

/** Spies on Alert.alert and auto-presses the button with the given label. */
function autoConfirmAlert(label: string) {
  return jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
    const btn = (buttons ?? []).find((b) => b.text === label);
    btn?.onPress?.();
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('HomeScreen — attendance check-in / check-out', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default state: valid employee session, can check in, GPS available
    mockLoadSession.mockResolvedValue(EMPLOYEE_SESSION);
    mockQueryState.data = todayApiResponse({ canCheckIn: true });
    mockGetCurrentLocation.mockResolvedValue({
      latitude: 24.7136, longitude: 46.6753, accuracy: 5,
    });
    mockCheckIn.mockResolvedValue(
      todayApiResponse({ status: 'PRESENT', canCheckIn: false, canCheckOut: true })
    );
    mockCheckOut.mockResolvedValue(
      todayApiResponse({
        status: 'PRESENT', canCheckIn: false, canCheckOut: false,
        checkOutTime: '2026-07-20T15:00:00Z',
      })
    );
  });

  afterEach(async () => {
    await cleanup();
  });

  // ── 1. Renders the Check-In button ────────────────────────────────────────

  it('renders the Check-In button when canCheckIn is true', async () => {
    mockQueryState.data = todayApiResponse({ canCheckIn: true });

    const { getByTestId } = await render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('btn-check-in')).toBeTruthy();
    });
  });

  // ── 2. Successful check-in within geofence ─────────────────────────────────

  it('calls checkIn with GPS coords and invalidates the query on success', async () => {
    mockQueryState.data = todayApiResponse({ canCheckIn: true });

    const alertSpy = autoConfirmAlert('Check In');

    const { getByTestId } = await render(<HomeScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('btn-check-in'));
    });

    await waitFor(() => {
      // Location service was invoked
      expect(mockGetCurrentLocation).toHaveBeenCalledTimes(1);
      // API was called with the right coords and bypassGeofence=false
      expect(mockCheckIn).toHaveBeenCalledWith(24.7136, 46.6753, false);
      // Query cache refreshed after success
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['attendance', 'today'],
      });
    });

    alertSpy.mockRestore();
  });

  // ── 3. Check-in outside geofence → Alert (not silent) ─────────────────────

  it('shows a Check-in Failed Alert with the geofence error message', async () => {
    mockQueryState.data = todayApiResponse({ canCheckIn: true });

    const { ApiError: AE } = require('@/services/api');
    mockCheckIn.mockRejectedValueOnce(
      new AE('OUTSIDE_GEOFENCE', 'You are outside the allowed check-in area.', 400)
    );

    // Step 1: capture all Alert calls while auto-confirming the confirmation dialog
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const confirmBtn = (buttons ?? []).find((b) => b.text === 'Check In');
      confirmBtn?.onPress?.();
    });

    const { getByTestId } = await render(<HomeScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('btn-check-in'));
    });

    await waitFor(() => {
      const errorCall = alertSpy.mock.calls.find(([title]) => title === 'Check-in Failed');
      expect(errorCall).toBeTruthy();
      expect(errorCall![1]).toBe('You are outside the allowed check-in area.');
    });

    alertSpy.mockRestore();
  });

  // ── 4. geofenceOverride notice ─────────────────────────────────────────────

  it('shows the geofence-bypass notice when today.geofenceOverride is true', async () => {
    mockQueryState.data = todayApiResponse({
      canCheckIn:       false,
      canCheckOut:      true,
      status:           'PRESENT',
      checkInTime:      '2026-07-20T07:00:00Z',
      geofenceOverride: true,
    });

    const { getByText } = await render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText(/geofence bypassed/i)).toBeTruthy();
    });
  });

  // ── 5. Location permission denied → actionable message ────────────────────

  it('shows an actionable Alert when location permission is denied', async () => {
    mockQueryState.data = todayApiResponse({ canCheckIn: true });

    mockGetCurrentLocation.mockRejectedValueOnce(
      'Location permission is required to check in. Please allow location access in Settings.'
    );

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const confirmBtn = (buttons ?? []).find((b) => b.text === 'Check In');
      confirmBtn?.onPress?.();
    });

    const { getByTestId } = await render(<HomeScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('btn-check-in'));
    });

    await waitFor(() => {
      const errorCall = alertSpy.mock.calls.find(([title]) => title === 'Check-in Failed');
      expect(errorCall).toBeTruthy();
      expect(errorCall![1]).toMatch(/location permission/i);
      expect(errorCall![1]).toMatch(/settings/i);
    });

    alertSpy.mockRestore();
  });

  // ── 6. API timeout / network error → error shown, no infinite spinner ──────

  it('surfaces a network error in an Alert instead of leaving the button spinning', async () => {
    mockQueryState.data = todayApiResponse({ canCheckIn: true });

    const { ApiError: AE } = require('@/services/api');
    mockCheckIn.mockRejectedValueOnce(
      new AE('NETWORK_ERROR', 'Request timed out. Please try again.', 0)
    );

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const confirmBtn = (buttons ?? []).find((b) => b.text === 'Check In');
      confirmBtn?.onPress?.();
    });

    const { getByTestId } = await render(<HomeScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('btn-check-in'));
    });

    await waitFor(() => {
      const errorCall = alertSpy.mock.calls.find(([title]) => title === 'Check-in Failed');
      expect(errorCall).toBeTruthy();
      expect(errorCall![1]).toMatch(/timed out/i);
    });

    // The button must NOT be disabled after the error (would trap the user)
    const btn = getByTestId('btn-check-in');
    expect(btn.props.accessibilityState?.disabled).not.toBe(true);

    alertSpy.mockRestore();
  });

  // ── 7. Check-out after check-in succeeds ──────────────────────────────────

  it('calls checkOut with GPS coords and invalidates the query on success', async () => {
    mockQueryState.data = todayApiResponse({
      canCheckIn:  false,
      canCheckOut: true,
      status:      'PRESENT',
      checkInTime: '2026-07-20T07:00:00Z',
    });

    const alertSpy = autoConfirmAlert('Check Out');

    const { getByTestId } = await render(<HomeScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('btn-check-out'));
    });

    await waitFor(() => {
      expect(mockGetCurrentLocation).toHaveBeenCalledTimes(1);
      expect(mockCheckOut).toHaveBeenCalledWith(24.7136, 46.6753);
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ['attendance', 'today'],
      });
    });

    alertSpy.mockRestore();
  });

  // ── 8. Check-out error shown in Alert ─────────────────────────────────────

  it('shows a Check-out Failed Alert when check-out returns an API error', async () => {
    mockQueryState.data = todayApiResponse({
      canCheckIn:  false,
      canCheckOut: true,
      status:      'PRESENT',
      checkInTime: '2026-07-20T07:00:00Z',
    });

    const { ApiError: AE } = require('@/services/api');
    mockCheckOut.mockRejectedValueOnce(
      new AE('OUTSIDE_GEOFENCE', 'You are outside the allowed check-out area.', 400)
    );

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _msg, buttons) => {
      const confirmBtn = (buttons ?? []).find((b) => b.text === 'Check Out');
      confirmBtn?.onPress?.();
    });

    const { getByTestId } = await render(<HomeScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('btn-check-out'));
    });

    await waitFor(() => {
      const errorCall = alertSpy.mock.calls.find(([title]) => title === 'Check-out Failed');
      expect(errorCall).toBeTruthy();
      expect(errorCall![1]).toBe('You are outside the allowed check-out area.');
    });

    alertSpy.mockRestore();
  });
});
