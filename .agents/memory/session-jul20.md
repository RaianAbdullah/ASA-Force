---
name: Session Jul 20 2026 — Business features + auth security
description: What was built and what's left for the next session pickup
---

## Built this session

### Backend (79 Java files, V11 migration at rest)
- Auth: forgot-password, reset-password, change-password, sessions list/revoke, logout-all
- Refresh token system (rotating, SHA-256 hash, reuse detection, family revocation)
- Department API: GET /v1/departments, POST, PATCH /{id}, DELETE /{id}
- Schedule API: GET /v1/schedules/my, /my/recent, POST (admin)
- Vacation API: POST /v1/vacations, GET /my, cancel, pending, all, approve, reject
- New packages: department/*, schedule/*, vacation/* under com.asa.workforce
- DTOs in department/dto, schedule/dto, vacation/dto

### Mobile
- Login "Forgot Password?" now navigates to /(auth)/forgot-password (was alert stub)
- New tab: schedule.tsx — current week, shift times, work days grid
- New tab: vacations.tsx — submit, cancel, history with status badges
- Profile tab: sessions list, revoke, logout-all, change-password nav
- Admin: /(admin)/vacations.tsx — approve/reject with notes, pending/all tabs
- Admin header: sun icon button navigates to vacation screen
- api.ts: departmentApi, scheduleApi, vacationApi all wired up

## Pickup point for next session

1. **JWT_SECRET** — set as Replit secret before deploy:
   `openssl rand -base64 64`  then add via environment-secrets skill

2. **Production profile** — create backend/src/main/resources/application-production.yml:
   - jwt.access-expiry-minutes: 15
   - Disable swagger (springdoc.swagger-ui.enabled: false)
   - Explicit CORS origin list (not *)
   - app.otp.log-to-console: false

3. **Deploy** — use deployment skill after JWT_SECRET + prod profile are set

4. **Nice to have** (not required for v1 deploy):
   - Attendance history screen (employee)
   - Admin: assign employees to departments (UI)
   - Admin: create weekly schedule UI
   - Notifications inbox screen

## Current state
- Both workflows RUNNING (api-server + asa-mobile expo)
- DB at Flyway V11
- No compilation errors
- Tasks #6 (session logout) and #7 (geofence) were PROPOSED — #6 is now addressed by the refresh+logout system
