import { loadSession, updateTokens, clearSession, Session } from './auth';

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

let sessionExpiredCallback: (() => void) | null = null;
export const setSessionExpiredCallback = (cb: () => void) => {
  sessionExpiredCallback = cb;
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

async function request<T>(
  url: string,
  options: RequestInit & { requiresAuth?: boolean } = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;
  let headers = new Headers(fetchOptions.headers);
  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let session = loadSession();
  if (requiresAuth && session?.token) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }

  let res = await fetch(`${BASE_URL}${url}`, { ...fetchOptions, headers });

  if (res.status === 401 && requiresAuth && session?.refreshToken) {
    // Attempt refresh
    try {
      const refreshRes = await fetch(`${BASE_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken })
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.data) {
          updateTokens(refreshData.data.accessToken, refreshData.data.refreshToken);
          headers.set('Authorization', `Bearer ${refreshData.data.accessToken}`);
          res = await fetch(`${BASE_URL}${url}`, { ...fetchOptions, headers });
        } else {
          throw new Error('Refresh failed');
        }
      } else {
        throw new Error('Refresh failed');
      }
    } catch (e) {
      clearSession();
      if (sessionExpiredCallback) sessionExpiredCallback();
      throw new ApiError('UNAUTHORIZED', 'Session expired', 401);
    }
  }

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch (e) {
    if (!res.ok) throw new ApiError('NETWORK_ERROR', 'Network error or invalid JSON response', res.status);
    json = { success: true } as ApiResponse<T>;
  }

  if (!res.ok || !json.success) {
    throw new ApiError(
      json.error?.code || 'UNKNOWN_ERROR',
      json.error?.message || 'An error occurred',
      res.status
    );
  }

  return json.data as T;
}

// ================= TYPES =================
export interface AttendanceResponse {
  id?: string;
  attendanceDate: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'HOLIDAY';
  checkInTime?: string;
  checkOutTime?: string;
  minutesLate: number;
  canCheckIn: boolean;
  canCheckOut: boolean;
  workedMinutes?: number;
  shiftStart?: string;
  shiftEnd?: string;
}

export interface AdminAttendanceSummary {
  date: string;
  totalActive: number;
  checkedIn: number;
  late: number;
  absent: number;
  excused: number;
  records: {
    id: string;
    employeeId: string;
    firstNameAr: string;
    lastNameAr: string;
    departmentNameAr: string;
    status: string;
    checkInTime?: string;
    checkOutTime?: string;
    minutesLate: number;
    workedMinutes?: number;
  }[];
}

export interface EmployeeSummaryDto {
  id: string;
  nationalId: string;
  firstNameAr: string;
  middleNameAr?: string;
  lastNameAr: string;
  departmentId?: string;
  departmentNameAr?: string;
  role: string;
  roles: string[];
  status?: string;
  maskedPhone?: string;
  vacationDaysPerYear?: number;
}

export interface DepartmentDto {
  id: string;
  nameEn: string;
  nameAr: string;
  code: string;
  isActive: boolean;
  managerId?: string;
  managerName?: string;
  employeeCount: number;
  createdAt: string;
}

export interface ScheduleDto {
  id: string;
  weekStart: string;
  workDays: string;
  shiftStart: string;
  shiftEnd: string;
  isWeekendDuty: boolean;
  notes?: string;
  todayIsWorkDay: boolean;
}

export interface SwapRequestDto {
  id: string;
  requesterId: string;
  requesterName: string;
  targetId: string;
  targetName: string;
  requesterWeekStart: string;
  targetWeekStart: string;
  reason?: string;
  status: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface VacationRequestDto {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  departmentNameAr?: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: string;
  reviewerNameAr?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export interface VacationBalanceDto {
  daysAllowed: number;
  daysUsed: number;
  daysRemaining: number;
  year: number;
}

export interface MessageDto {
  id: string;
  senderId: string;
  senderNameAr: string;
  senderRole: string;
  body?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  sentAt: string;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  authorId: string;
  authorNameAr: string;
  authorRole: string;
  createdAt: string;
  replyCount: number;
  replies?: ReplyDto[];
}

export interface ReplyDto {
  id: string;
  authorId: string;
  authorNameAr: string;
  authorRole: string;
  body: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

// ================= APIS =================

export const authApi = {
  register: (body: any) => request<any>('/v1/auth/register', { method: 'POST', body: JSON.stringify(body), requiresAuth: false }),
  verifyOtp: (nationalId: string, otpCode: string) => request<any>('/v1/auth/verify-otp', { method: 'POST', body: JSON.stringify({ nationalId, otpCode }), requiresAuth: false }),
  login: (nationalId: string, password: string) => request<any>('/v1/auth/login', { method: 'POST', body: JSON.stringify({ nationalId, password }), requiresAuth: false }),
  logout: (refreshToken?: string) => request<any>('/v1/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  forgotPassword: (nationalId: string) => request<any>('/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify({ nationalId }), requiresAuth: false }),
  resetPassword: (resetToken: string, newPassword: string) => request<any>('/v1/auth/reset-password', { method: 'POST', body: JSON.stringify({ resetToken, newPassword }), requiresAuth: false }),
  changePassword: (currentPassword: string, newPassword: string) => request<any>('/v1/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  resendOtp: (nationalId: string) => request<any>('/v1/auth/resend-otp', { method: 'POST', body: JSON.stringify({ nationalId }), requiresAuth: false }),
  getStatus: (nationalId: string) => request<any>(`/v1/auth/status/${nationalId}`, { requiresAuth: false }),
};

export const adminApi = {
  listPending: (page = 0, size = 20) => request<PageResponse<any>>(`/v1/admin/registrations/pending?page=${page}&size=${size}`),
  approve: (id: string) => request<any>(`/v1/admin/registrations/${id}/approve`, { method: 'PATCH' }),
  reject: (id: string, reason: string) => request<any>(`/v1/admin/registrations/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  listAllEmployees: () => request<EmployeeSummaryDto[]>('/v1/admin/employees'),
  listActiveEmployees: () => request<EmployeeSummaryDto[]>('/v1/admin/employees/active'),
  createEmployee: (body: any) => request<any>('/v1/admin/employees', { method: 'POST', body: JSON.stringify(body) }),
  updateEmployee: (id: string, body: any) => request<any>(`/v1/admin/employees/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteEmployee: (id: string) => request<any>(`/v1/admin/employees/${id}`, { method: 'DELETE' }),
};

export const attendanceApi = {
  checkIn: (latitude: number, longitude: number, bypassGeofence?: boolean) => request<AttendanceResponse>('/v1/attendance/check-in', { method: 'POST', body: JSON.stringify({ latitude, longitude, bypassGeofence }) }),
  checkOut: (latitude: number, longitude: number) => request<AttendanceResponse>('/v1/attendance/check-out', { method: 'POST', body: JSON.stringify({ latitude, longitude }) }),
  getToday: () => request<AttendanceResponse>('/v1/attendance/today'),
  getHistory: (page = 0, size = 20) => request<PageResponse<AttendanceResponse>>(`/v1/attendance/history?page=${page}&size=${size}`),
  getTodaySummary: (departmentId?: string) => request<AdminAttendanceSummary>(`/v1/admin/attendance/today${departmentId ? `?departmentId=${departmentId}` : ''}`),
};

export const departmentApi = {
  listActive: () => request<DepartmentDto[]>('/v1/departments'),
  listAll: () => request<DepartmentDto[]>('/v1/departments/all'),
  getById: (id: string) => request<DepartmentDto>(`/v1/departments/${id}`),
  create: (body: any) => request<DepartmentDto>('/v1/departments', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => request<DepartmentDto>(`/v1/departments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deactivate: (id: string) => request<any>(`/v1/departments/${id}`, { method: 'DELETE' }),
};

export const scheduleApi = {
  getMySchedule: () => request<ScheduleDto>('/v1/schedules/my'),
  getMyRecent: () => request<ScheduleDto[]>('/v1/schedules/my/recent'),
  create: (body: any) => request<ScheduleDto>('/v1/schedules', { method: 'POST', body: JSON.stringify(body) }),
  deleteSchedule: (id: string) => request<any>(`/v1/schedules/${id}`, { method: 'DELETE' }),
  getMySwaps: () => request<SwapRequestDto[]>('/v1/schedule/swaps/my'),
  createSwapRequest: (body: any) => request<SwapRequestDto>('/v1/schedule/swaps', { method: 'POST', body: JSON.stringify(body) }),
  getPendingSwaps: () => request<SwapRequestDto[]>('/v1/schedule/swaps/pending'),
  approveSwap: (id: string, notes?: string) => request<any>(`/v1/schedule/swaps/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ notes }) }),
  rejectSwap: (id: string, notes?: string) => request<any>(`/v1/schedule/swaps/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ notes }) }),
};

export const vacationApi = {
  getBalance: () => request<VacationBalanceDto>('/v1/vacations/balance'),
  submit: (startDate: string, endDate: string, reason?: string) => request<VacationRequestDto>('/v1/vacations', { method: 'POST', body: JSON.stringify({ startDate, endDate, reason }) }),
  getMyRequests: () => request<VacationRequestDto[]>('/v1/vacations/my'),
  cancel: (id: string) => request<any>(`/v1/vacations/${id}/cancel`, { method: 'POST' }),
  getPending: () => request<VacationRequestDto[]>('/v1/vacations/pending'),
  getAll: () => request<VacationRequestDto[]>('/v1/vacations/all'),
  approve: (id: string, notes?: string) => request<any>(`/v1/vacations/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ notes }) }),
  reject: (id: string, notes?: string) => request<any>(`/v1/vacations/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ notes }) }),
};

export const messageApi = {
  list: () => request<MessageDto[]>('/v1/messages'),
  send: (body: string) => request<MessageDto>('/v1/messages', { method: 'POST', body: JSON.stringify({ body }) }),
  sendWithAttachment: async (file: File, bodyText?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (bodyText) formData.append('body', bodyText);
    
    // Manual request because it's multipart
    let session = loadSession();
    let headers = new Headers();
    if (session?.token) headers.set('Authorization', `Bearer ${session.token}`);
    
    let res = await fetch(`${BASE_URL}/v1/messages/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    let json = await res.json();
    if (!res.ok || !json.success) throw new ApiError(json.error?.code, json.error?.message, res.status);
    return json.data as MessageDto;
  },
  delete: (id: string) => request<any>(`/v1/messages/${id}`, { method: 'DELETE' }),
};

export const announcementApi = {
  list: () => request<AnnouncementDto[]>('/v1/announcements'),
  getThread: (id: string) => request<AnnouncementDto>(`/v1/announcements/${id}`),
  create: (title: string, body: string, pinned?: boolean) => request<AnnouncementDto>('/v1/announcements', { method: 'POST', body: JSON.stringify({ title, body, pinned }) }),
  reply: (id: string, body: string) => request<ReplyDto>(`/v1/announcements/${id}/replies`, { method: 'POST', body: JSON.stringify({ body }) }),
  delete: (id: string) => request<any>(`/v1/announcements/${id}`, { method: 'DELETE' }),
};
