/**
 * ASA Workforce — API service layer
 *
 * Base URL: the api-server artifact proxies /api → Spring Boot :8080.
 * EXPO_PUBLIC_DOMAIN can be set to the deployed API host for device builds.
 *
 * Automatic token refresh:
 *   - On any 401 from an authenticated request, the client silently tries
 *     POST /v1/auth/refresh once. On success the new tokens are persisted
 *     and the original request is retried. On failure clearSession() is
 *     called so the app navigates to the login screen.
 *   - Only one refresh attempt runs at a time (lock prevents stampede).
 */
import { loadSession, updateTokens, clearSession, isTokenExpired } from './auth';

export const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : '/api';

// ── Session-expired callback (registered by root layout) ─────────────────────
// When a token cannot be refreshed the app must navigate to the login screen.
// Because api.ts is not a React module it cannot call router directly — instead
// it invokes this callback which is wired up by _layout.tsx on mount.
let _onSessionExpired: (() => void) | null = null;
export function setSessionExpiredCallback(cb: () => void) {
  _onSessionExpired = cb;
}
function triggerSessionExpired() {
  _onSessionExpired?.();
}

// ── Refresh lock (prevents concurrent refresh stampede) ──────────────────────
let refreshInFlight: Promise<boolean> | null = null;

async function silentRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const session = await loadSession();
      if (!session?.refreshToken) {
        await clearSession();
        triggerSessionExpired();
        return false;
      }

      const res = await fetch(`${BASE_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });

      if (!res.ok) {
        await clearSession();
        triggerSessionExpired();
        return false;
      }

      const json = await res.json() as ApiResponse<LoginResponse>;
      if (!json.success || !json.data) {
        await clearSession();
        triggerSessionExpired();
        return false;
      }

      await updateTokens(json.data.accessToken, json.data.refreshToken);
      return true;
    } catch {
      await clearSession();
      triggerSessionExpired();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

// ── Generic request helper ────────────────────────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
  timestamp: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requiresAuth = false,
  _isRetry = false        // internal — prevents infinite refresh loop
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const session = await loadSession();
    if (session?.token) {
      // Proactively refresh if the access token is about to expire
      if (!_isRetry && isTokenExpired(session.token)) {
        const refreshed = await silentRefresh();
        if (!refreshed) {
          throw new ApiError('SESSION_EXPIRED', 'Session expired. Please log in again.', 401);
        }
        // Reload session to get the new access token
        const fresh = await loadSession();
        if (fresh?.token) headers['Authorization'] = `Bearer ${fresh.token}`;
      } else {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Reactive refresh — server rejected the token (e.g. blacklisted, clock skew)
  if (res.status === 401 && requiresAuth && !_isRetry) {
    const refreshed = await silentRefresh();
    if (refreshed) {
      return request<T>(path, options, requiresAuth, true);
    }
    throw new ApiError('SESSION_EXPIRED', 'Session expired. Please log in again.', 401);
  }

  // Parse JSON — may throw if the server returned non-JSON (e.g. 502)
  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    throw new ApiError('NETWORK_ERROR', `Server error (${res.status})`, res.status);
  }

  if (!res.ok || !json.success) {
    const msg = json.error?.message ?? `Request failed (${res.status})`;
    throw new ApiError(json.error?.code ?? 'UNKNOWN_ERROR', msg, res.status);
  }

  return json;
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 0
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

export interface RegisterRequest {
  nationalId:   string;
  firstNameAr:  string;
  middleNameAr?: string;
  lastNameAr:   string;
  phoneNumber:  string;
  password:     string;
}
export interface RegisterResponse {
  employeeId:  string;
  nationalId:  string;
  status:      string;
  message:     string;
  maskedPhone: string;
  otpHint?:    string;
}
export interface VerifyOtpRequest  { nationalId: string; otpCode: string; }
export interface VerifyOtpResponse { status: string; message: string; }
export interface LoginRequest      { nationalId: string; password: string; }
export interface LoginResponse {
  accessToken:           string;
  refreshToken:          string;
  tokenType:             string;
  accessExpiresInSeconds: number;
  refreshExpiresInDays:  number;
  employeeId:            string;
  /** Primary role (highest-priority). */
  role:                  string;
  /** Full set of assigned roles. */
  roles:                 string[];
  nameAr:                string;
  status:                string;
  mustChangePassword:    boolean;
}

export interface SessionDto {
  id:          string;
  deviceInfo?: string;
  issuedAt:    string;
  expiresAt:   string;
  lastUsedAt?: string;
}

export const authApi = {
  register: (body: RegisterRequest) =>
    request<RegisterResponse>('/v1/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  verifyOtp: (body: VerifyOtpRequest) =>
    request<VerifyOtpResponse>('/v1/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: LoginRequest) =>
    request<LoginResponse>('/v1/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  /** Revokes the current access token and (if provided) the refresh token session. */
  logout: (refreshToken?: string) =>
    request<void>('/v1/auth/logout', {
      method: 'POST',
      body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
    }, true),

  logoutAll: () =>
    request<void>('/v1/auth/logout-all', { method: 'POST' }, true),

  forgotPassword: (nationalId: string) =>
    request<void>('/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ nationalId }),
    }),

  resetPassword: (resetToken: string, newPassword: string) =>
    request<void>('/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<void>('/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }, true),

  resendOtp: (nationalId: string) =>
    request<{ message: string }>('/v1/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ nationalId }),
    }),

  getSessions: () =>
    request<SessionDto[]>('/v1/auth/sessions', {}, true),

  revokeSession: (sessionId: string) =>
    request<void>(`/v1/auth/sessions/${sessionId}`, { method: 'DELETE' }, true),

  getStatus: (nationalId: string) =>
    request<{ status: string; message: string }>(`/v1/auth/status/${nationalId}`),
};

// ── Admin endpoints ───────────────────────────────────────────────────────────

export interface PendingEmployee {
  id:            string;
  nationalId:    string;
  firstNameAr:   string;
  lastNameAr:    string;
  maskedPhone:   string;
  status:        string;
  registeredAt:  string;
  otpVerifiedAt: string;
}
export interface PageResponse<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
  last:          boolean;
}

export interface EmployeeSummaryDto {
  id:                   string;
  nationalId:           string;
  firstNameAr:          string;
  middleNameAr?:        string;
  lastNameAr:           string;
  departmentId?:        string;
  departmentNameAr?:    string;
  /** Primary role (highest-priority). */
  role:                 string;
  /** Full set of assigned roles. */
  roles:                string[];
  status?:              string;
  maskedPhone?:         string;
  vacationDaysPerYear?: number;
}

export interface CreateEmployeeRequest {
  nationalId:    string;
  firstNameAr:   string;
  middleNameAr?: string;
  lastNameAr:    string;
  phoneNumber:   string;
  departmentId?: string;
  role:          string;
}

export interface CreateEmployeeResponse {
  employeeId:       string;
  nationalId:       string;
  firstNameAr:      string;
  lastNameAr:       string;
  role:             string;
  departmentNameAr?: string;
  tempPassword:     string;
  message:          string;
}

export const adminApi = {
  listPending: (page = 0, size = 20) =>
    request<PageResponse<PendingEmployee>>(
      `/v1/admin/registrations/pending?page=${page}&size=${size}`,
      {}, true
    ),

  approve: (employeeId: string) =>
    request<Record<string, string>>(
      `/v1/admin/registrations/${employeeId}/approve`,
      { method: 'PATCH', body: JSON.stringify({}) }, true
    ),

  reject: (employeeId: string, reason: string) =>
    request<Record<string, string>>(
      `/v1/admin/registrations/${employeeId}/reject`,
      { method: 'PATCH', body: JSON.stringify({ reason }) }, true
    ),

  /** Active employees only — use for pickers/schedule assignment. */
  listEmployees: () =>
    request<EmployeeSummaryDto[]>('/v1/admin/employees/active', {}, true),

  /** All employees regardless of status — use for admin management screens. */
  listAllEmployees: () =>
    request<EmployeeSummaryDto[]>('/v1/admin/employees', {}, true),

  createEmployee: (body: CreateEmployeeRequest) =>
    request<CreateEmployeeResponse>('/v1/admin/employees', {
      method: 'POST',
      body: JSON.stringify(body),
    }, true),

  /** Active employees — for pickers and swap screens. */
  listActiveEmployees: () =>
    request<EmployeeSummaryDto[]>('/v1/admin/employees/active', {}, true),

  deleteEmployee: (id: string) =>
    request<{ message: string; deletedName: string }>(`/v1/admin/employees/${id}`, {
      method: 'DELETE',
    }, true),

  updateEmployee: (id: string, body: {
    firstNameAr?: string; middleNameAr?: string; lastNameAr?: string; phoneNumber?: string;
    /** Full list of roles to assign. Takes precedence over 'role' when provided. */
    roles?: string[];
    role?: string; status?: string; departmentId?: string; vacationDaysPerYear?: number;
  }) =>
    request<EmployeeSummaryDto>(`/v1/admin/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }, true),

  getAttendanceSummary: (date?: string, departmentId?: string) => {
    const p: string[] = [];
    if (date)         p.push(`date=${date}`);
    if (departmentId) p.push(`departmentId=${departmentId}`);
    return request<AdminAttendanceSummary>(
      `/v1/admin/attendance/today${p.length ? '?' + p.join('&') : ''}`, {}, true);
  },

  listDepartments: () =>
    request<DepartmentDto[]>('/v1/departments', {}, true),
};

// ── Attendance endpoints ──────────────────────────────────────────────────────

export interface AttendanceResponse {
  id?:               string;
  attendanceDate:    string;
  status:            'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'HOLIDAY';
  checkInTime?:      string;
  checkInLatitude?:  number;
  checkInLongitude?: number;
  checkOutTime?:     string;
  checkOutLatitude?: number;
  checkOutLongitude?:number;
  minutesLate:       number;
  geofenceOverride:  boolean;
  shiftStart?:       string;
  shiftEnd?:         string;
  canCheckIn:        boolean;
  canCheckOut:       boolean;
  workedMinutes?:    number;
}

export interface AdminAttendanceSummary {
  date:        string;
  totalActive: number;
  checkedIn:   number;
  late:        number;
  absent:      number;
  excused:     number;
  records:     AdminAttendanceRow[];
}

export interface AdminAttendanceRow {
  id:               string;
  employeeId:       string;
  firstNameAr:      string;
  lastNameAr:       string;
  departmentNameAr: string;
  departmentNameEn: string;
  status:           string;
  checkInTime?:     string;
  checkOutTime?:    string;
  minutesLate:      number;
  workedMinutes?:   number;
}

export const attendanceApi = {
  checkIn: (latitude: number, longitude: number, bypassGeofence = false) =>
    request<AttendanceResponse>('/v1/attendance/check-in',
      { method: 'POST', body: JSON.stringify({ latitude, longitude, bypassGeofence }) }, true),

  checkOut: (latitude: number, longitude: number) =>
    request<AttendanceResponse>('/v1/attendance/check-out',
      { method: 'POST', body: JSON.stringify({ latitude, longitude }) }, true),

  getToday: () =>
    request<AttendanceResponse>('/v1/attendance/today', {}, true),

  getHistory: (page = 0, size = 30) =>
    request<PageResponse<AttendanceResponse>>(
      `/v1/attendance/history?page=${page}&size=${size}`, {}, true),
};

export const adminAttendanceApi = {
  getTodaySummary: (departmentId?: string) =>
    request<AdminAttendanceSummary>(
      `/v1/admin/attendance/today${departmentId ? `?departmentId=${departmentId}` : ''}`,
      {}, true),
};

// ── Department endpoints ──────────────────────────────────────────────────────

export interface DepartmentDto {
  id:               string;
  nameEn:           string;
  nameAr:           string;
  code:             string;
  isActive:         boolean;
  isCrossDepartment:boolean;
  managerId?:       string;
  managerName?:     string;
  employeeCount:    number;
  createdAt:        string;
}

export const departmentApi = {
  listActive: () => request<DepartmentDto[]>('/v1/departments', {}, true),
  listAll:    () => request<DepartmentDto[]>('/v1/departments/all', {}, true),
  getById:    (id: string) => request<DepartmentDto>(`/v1/departments/${id}`, {}, true),

  create: (nameEn: string, nameAr: string, code: string, managerId?: string) =>
    request<DepartmentDto>('/v1/departments', {
      method: 'POST',
      body: JSON.stringify({ nameEn, nameAr, code, managerId }),
    }, true),

  update: (id: string, fields: { nameEn?: string; nameAr?: string; managerId?: string; isActive?: boolean }) =>
    request<DepartmentDto>(`/v1/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(fields),
    }, true),

  deactivate: (id: string) =>
    request<void>(`/v1/departments/${id}`, { method: 'DELETE' }, true),
};

// ── Schedule endpoints ────────────────────────────────────────────────────────

export interface ScheduleDto {
  id:             string;
  weekStart:      string;
  workDays:       string;  // "SUN,MON,TUE,WED,THU"
  shiftStart:     string;  // "07:00:00"
  shiftEnd:       string;  // "15:00:00"
  isWeekendDuty:  boolean;
  notes?:         string;
  todayIsWorkDay: boolean;
}

export const scheduleApi = {
  getMySchedule:  () => request<ScheduleDto | null>('/v1/schedules/my', {}, true),
  getMyRecent:    () => request<ScheduleDto[]>('/v1/schedules/my/recent', {}, true),

  // Admin — returns recent schedules across all employees (reuses /my/recent for simplicity)
  getAdminRecent: () => request<ScheduleDto[]>('/v1/schedules/my/recent', {}, true),

  create: (data: {
    employeeId:    string;
    weekStart:     string;
    workDays:      string;
    shiftStart:    string;
    shiftEnd:      string;
    isWeekendDuty: boolean;
    notes?:        string;
  }) =>
    request<ScheduleDto>('/v1/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }, true),

  deleteSchedule: (id: string) =>
    request<void>(`/v1/schedules/${id}`, { method: 'DELETE' }, true),

  getMySwaps: () =>
    request<SwapRequestDto[]>('/v1/schedule/swaps/my', {}, true),

  createSwapRequest: (body: {
    targetEmployeeId: string; myWeekStart: string; theirWeekStart: string; reason?: string;
  }) =>
    request<SwapRequestDto>('/v1/schedule/swaps', {
      method: 'POST',
      body: JSON.stringify(body),
    }, true),

  getPendingSwaps: () =>
    request<SwapRequestDto[]>('/v1/schedule/swaps/pending', {}, true),

  approveSwap: (id: string, notes?: string) =>
    request<SwapRequestDto>(`/v1/schedule/swaps/${id}/approve`, {
      method: 'PATCH', body: JSON.stringify({ notes }),
    }, true),

  rejectSwap: (id: string, notes?: string) =>
    request<SwapRequestDto>(`/v1/schedule/swaps/${id}/reject`, {
      method: 'PATCH', body: JSON.stringify({ notes }),
    }, true),
};

// ── Vacation endpoints ────────────────────────────────────────────────────────

export interface VacationRequestDto {
  id:               string;
  employeeId:       string;
  employeeNameAr:   string;
  departmentNameAr?: string;
  startDate:        string;
  endDate:          string;
  totalDays:        number;
  reason?:          string;
  status:           'PENDING_DEPT_MANAGER' | 'PENDING_MAIN_MANAGER' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  // Stage 1 — department manager review
  deptReviewerNameAr?: string;
  deptReviewedAt?:     string;
  deptReviewNotes?:    string;
  // Stage 2 — main manager final review
  reviewerNameAr?:  string;
  reviewedAt?:      string;
  reviewNotes?:     string;
  createdAt:        string;
}

export interface VacationBalanceDto {
  daysAllowed:   number;
  daysUsed:      number;
  daysRemaining: number;
  year:          number;
}

export interface SwapRequestDto {
  id:                 string;
  requesterId:        string;
  requesterName:      string;
  targetId:           string;
  targetName:         string;
  requesterWeekStart: string;
  targetWeekStart:    string;
  reason?:            string;
  status:             string;
  reviewNotes?:       string;
  createdAt:          string;
}

export const vacationApi = {
  getBalance: () =>
    request<VacationBalanceDto>('/v1/vacations/balance', {}, true),

  submit:   (startDate: string, endDate: string, reason?: string) =>
    request<VacationRequestDto>('/v1/vacations', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate, reason }),
    }, true),

  getMyRequests: () =>
    request<VacationRequestDto[]>('/v1/vacations/my', {}, true),

  cancel:   (id: string) =>
    request<void>(`/v1/vacations/${id}/cancel`, { method: 'POST' }, true),

  // Admin/Manager
  getPending: () =>
    request<VacationRequestDto[]>('/v1/vacations/pending', {}, true),

  getAll: () =>
    request<VacationRequestDto[]>('/v1/vacations/all', {}, true),

  approve: (id: string, notes?: string) =>
    request<VacationRequestDto>(`/v1/vacations/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    }, true),

  reject: (id: string, notes?: string) =>
    request<VacationRequestDto>(`/v1/vacations/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    }, true),
};

// ── Message endpoints ─────────────────────────────────────────────────────────

export interface MessageDto {
  id:              string;
  senderId:        string;
  senderNameAr:    string;
  senderRole:      string;
  body?:           string | null;
  attachmentUrl?:  string | null;
  attachmentType?: 'image' | 'file' | null;
  attachmentName?: string | null;
  sentAt:          string;
}

export type AttachmentFile = {
  uri:      string;
  name:     string;
  mimeType: string;
};

export const messageApi = {
  list: () =>
    request<MessageDto[]>('/v1/messages', {}, true),

  listAfter: (after: string) =>
    request<MessageDto[]>(`/v1/messages?after=${encodeURIComponent(after)}`, {}, true),

  send: (body: string) =>
    request<MessageDto>('/v1/messages', {
      method: 'POST',
      body: JSON.stringify({ body }),
    }, true),

  /** Upload a message with an image or file attachment (optional text body). */
  sendWithAttachment: async (file: AttachmentFile, body?: string): Promise<ApiResponse<MessageDto>> => {
    const session = await loadSession();
    const token   = session?.token ?? '';

    const form = new FormData();
    if (body?.trim()) form.append('body', body.trim());
    // React Native / Expo FormData accepts this shape for files
    form.append('file', { uri: file.uri, name: file.name, type: file.mimeType } as any);

    const res = await fetch(`${BASE_URL}/v1/messages/upload`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    form,
    });

    let json: ApiResponse<MessageDto>;
    try { json = await res.json(); }
    catch { throw new ApiError('NETWORK_ERROR', `Server error (${res.status})`, res.status); }

    if (!res.ok || !json.success) {
      throw new ApiError(json.error?.code ?? 'UPLOAD_FAILED', json.error?.message ?? 'Upload failed', res.status);
    }
    return json;
  },

  delete: (id: string) =>
    request<void>(`/v1/messages/${id}`, { method: 'DELETE' }, true),
};

// ── Announcement endpoints ────────────────────────────────────────────────────

export interface ReplyDto {
  id:           string;
  authorId:     string;
  authorNameAr: string;
  authorRole:   string;
  body:         string;
  createdAt:    string;
}

export interface AnnouncementDto {
  id:           string;
  title:        string;
  body:         string;
  pinned:       boolean;
  authorId:     string;
  authorNameAr: string;
  authorRole:   string;
  createdAt:    string;
  replyCount:   number;
  replies:      ReplyDto[] | null;
}

export const announcementApi = {
  list: () =>
    request<AnnouncementDto[]>('/v1/announcements', {}, true),

  getThread: (id: string) =>
    request<AnnouncementDto>(`/v1/announcements/${id}`, {}, true),

  create: (title: string, body: string, pinned = false) =>
    request<AnnouncementDto>('/v1/announcements', {
      method: 'POST',
      body: JSON.stringify({ title, body, pinned }),
    }, true),

  reply: (id: string, body: string) =>
    request<ReplyDto>(`/v1/announcements/${id}/replies`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }, true),

  delete: (id: string) =>
    request<void>(`/v1/announcements/${id}`, { method: 'DELETE' }, true),
};

// ── Notification endpoints ────────────────────────────────────────────────────

export const notificationApi = {
  registerToken: (token: string, platform: 'ios' | 'android' | 'unknown') =>
    request<{ status: string }>(
      '/v1/notifications/push-token',
      { method: 'POST', body: JSON.stringify({ token, platform }) },
      true
    ),

  registerPendingToken: (
    nationalId: string,
    token: string,
    platform: 'ios' | 'android' | 'unknown',
  ) =>
    request<{ status: string }>(
      '/v1/notifications/push-token/pending',
      { method: 'POST', body: JSON.stringify({ nationalId, token, platform }) },
      false
    ),
};
