# API Design

**Status: Stage 1 — Design only. Implementation per stage.**

---

## Base URL

All endpoints are prefixed with `/api`. Versioning is via URL path: `/api/v1/`.

```
Development:  http://localhost:8080/api/v1
Production:   https://api.asa-force.com/api/v1
```

## Response Envelope

All responses use a standard envelope:

```json
// Success
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-01-01T08:00:00Z",
  "requestId": "abc123"
}

// Error
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials or account unavailable.",
    "details": null
  },
  "timestamp": "2025-01-01T08:00:00Z"
}
```

## Authentication Endpoints (Stage 4)

```
POST /api/v1/auth/register         Employee registration
POST /api/v1/auth/verify-otp       OTP verification
POST /api/v1/auth/resend-otp       Resend OTP (rate limited)
POST /api/v1/auth/login            Login → access + refresh tokens
POST /api/v1/auth/refresh          Rotate refresh token
POST /api/v1/auth/logout           Logout current session
POST /api/v1/auth/logout-all       Logout all sessions
POST /api/v1/auth/forgot-password  Request password reset
POST /api/v1/auth/reset-password   Complete password reset
POST /api/v1/auth/change-password  Change password (authenticated)
GET  /api/v1/auth/sessions         List active sessions
DELETE /api/v1/auth/sessions/{id}  Revoke specific session
```

## Admin Endpoints (Stage 5)

```
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/users/pending
POST   /api/v1/admin/users/{id}/approve
POST   /api/v1/admin/users/{id}/reject
POST   /api/v1/admin/users/{id}/suspend
POST   /api/v1/admin/users/{id}/reactivate
GET    /api/v1/admin/users
GET    /api/v1/admin/audit-logs
GET    /api/v1/admin/security-alerts
```

## Department Endpoints (Stage 6)

```
GET    /api/v1/departments
POST   /api/v1/departments
GET    /api/v1/departments/{id}
PATCH  /api/v1/departments/{id}
POST   /api/v1/departments/{id}/deactivate
POST   /api/v1/departments/{id}/manager
```

## Schedule Endpoints (Stage 7)

```
GET  /api/v1/schedules/me
GET  /api/v1/manager/schedules
POST /api/v1/admin/schedules
PATCH /api/v1/admin/schedules/{id}
POST /api/v1/admin/schedules/{id}/publish
GET  /api/v1/admin/schedules
```

## Attendance Endpoints (Stage 8)

```
POST /api/v1/attendance/check-in
GET  /api/v1/attendance/me
GET  /api/v1/manager/attendance
GET  /api/v1/admin/attendance
POST /api/v1/admin/attendance/{id}/correct
```

## Vacation Endpoints (Stage 9)

```
POST /api/v1/vacation-requests
GET  /api/v1/vacation-requests/me
GET  /api/v1/manager/vacation-requests
POST /api/v1/manager/vacation-requests/{id}/approve
POST /api/v1/manager/vacation-requests/{id}/reject
```

## Notification Endpoints (Stage 3)

```
GET  /api/v1/notifications
POST /api/v1/notifications/{id}/read
POST /api/v1/notifications/read-all
```

## Security Design Decisions

1. **Generic error messages** — Login errors never reveal whether email, password, or account status was wrong.
2. **Public UUIDs** — API uses `publicId` (UUID), never internal integer `id`.
3. **No sensitive data in responses** — password hashes, OTP hashes, raw tokens never returned.
4. **Pagination required** — all list endpoints require pagination params.
5. **Request size limits** — configured in Spring (1MB default, 10MB for file uploads).
6. **Correlation IDs** — every response includes `X-Request-ID` header.
