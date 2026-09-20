/**
 * Tests for the Admin Home screen — Sign Out / logout flow.
 *
 * Covers:
 *  1. Sign Out button calls authApi.logout with the current refresh token,
 *     then clearSession, then navigates to '/'.
 *  2. When authApi.logout throws a network error, clearSession is still called
 *     and the user is navigated to '/' (local sign-out always succeeds).
 */

import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';

// ── Router ───────────────────────────────────────────────────────────────────
const mockRouterReplace = jest.fn();
const mockRouterPush    = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockRouterReplace(...args),
    push:    (...args: unknown[]) => mockRouterPush(...args),
  },
}));

// ── Haptics ───────────────────────────────────────────────────────────────────
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  impactAsync:       jest.fn(),
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

// ── Safe area ─────────────────────────────────────────────────────────────────
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// ── Vector icons ──────────────────────────────────────────────────────────────
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// ── react-query ───────────────────────────────────────────────────────────────
const mockInvalidateQueries = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(() => ({ invalidateQueries: mockInvalidateQueries })),
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn((opts: any) => {
    const mutate = jest.fn(async (...args: unknown[]) => {
      try {
        const result = await opts.mutationFn(...args);
        await opts.onSuccess?.(result);
      } catch (err) {
        await opts.onError?.(err);
      }
    });
    return { mutate, isPending: false };
  }),
}));

// ── API services ──────────────────────────────────────────────────────────────
const mockLogout      = jest.fn();
const mockListPending = jest.fn();
const mockApprove     = jest.fn();
const mockReject      = jest.fn();
const mockGetPending  = jest.fn();

jest.mock('@/services/api', () => {
  class ApiError extends Error {
    code: string; status: number;
    constructor(code: string, message: string, status = 0) {
      super(message); this.name = 'ApiError'; this.code = code; this.status = status;
    }
  }
  return {
    authApi: {
      logout: (...a: unknown[]) => mockLogout(...a),
    },
    adminApi: {
      listPending: (...a: unknown[]) => mockListPending(...a),
      approve:     (...a: unknown[]) => mockApprove(...a),
      reject:      (...a: unknown[]) => mockReject(...a),
    },
    vacationApi: {
      getPending: (...a: unknown[]) => mockGetPending(...a),
    },
    ApiError,
  };
});

// ── Auth service ──────────────────────────────────────────────────────────────
const mockLoadSession  = jest.fn();
const mockClearSession = jest.fn();
jest.mock('@/services/auth', () => ({
  loadSession:  (...a: unknown[]) => mockLoadSession(...a),
  clearSession: (...a: unknown[]) => mockClearSession(...a),
}));

// ── Colors constant ───────────────────────────────────────────────────────────
jest.mock('@/constants/colors', () => ({
  __esModule: true,
  default: {
    light: {
      background:      '#F8F9FA',
      card:            '#FFFFFF',
      text:            '#111827',
      mutedForeground: '#6B7280',
      border:          '#E5E7EB',
      destructive:     '#EF4444',
    },
    government: {
      navy: '#1A2332',
      gold: '#C9A84C',
    },
  },
}));

// ── Static import (after mocks are hoisted) ───────────────────────────────────
import AdminPendingScreen from '../app/(admin)/index';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SESSION = {
  token:        'access-token',
  refreshToken: 'refresh-token-456',
  employeeId:   'admin-1',
  role:         'SYSTEM_ADMIN' as const,
  nameAr:       'منتظم',
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AdminPendingScreen — Sign Out', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadSession.mockResolvedValue(SESSION);
    mockListPending.mockResolvedValue({
      success: true,
      data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20, last: true },
    });
    mockLogout.mockResolvedValue({ success: true });
    mockClearSession.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await cleanup();
  });

  // ── 1. Happy path ─────────────────────────────────────────────────────────

  it('calls authApi.logout with the refresh token, then clearSession, then navigates to /', async () => {
    const { getByTestId } = await render(<AdminPendingScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('btn-sign-out'));
    });

    await waitFor(() => {
      // Must call server-side logout with the session's refresh token
      expect(mockLogout).toHaveBeenCalledWith(SESSION.refreshToken);
      // Must clear local session
      expect(mockClearSession).toHaveBeenCalledTimes(1);
      // Must navigate to the login root
      expect(mockRouterReplace).toHaveBeenCalledWith('/');
    });
  });

  // ── 2. Network error — local sign-out still happens ───────────────────────

  it('still calls clearSession and navigates to "/" even when authApi.logout throws', async () => {
    mockLogout.mockRejectedValueOnce(new Error('Network request failed'));

    const { getByTestId } = await render(<AdminPendingScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('btn-sign-out'));
    });

    await waitFor(() => {
      // logout was attempted
      expect(mockLogout).toHaveBeenCalledWith(SESSION.refreshToken);
      // local session cleared despite the network error
      expect(mockClearSession).toHaveBeenCalledTimes(1);
      // user still navigated out
      expect(mockRouterReplace).toHaveBeenCalledWith('/');
    });
  });
});
