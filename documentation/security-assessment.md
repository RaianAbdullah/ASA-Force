# ASA-Force Initial Security Assessment

## Assessment status

This is an initial, non-destructive security review of the source code and configuration. It is not a penetration test of the live Render deployment.

- **Assessment date:** 13 August 2026
- **Target reviewed:** local ASA-Force source tree
- **Data used:** source code and existing automated tests only
- **Live attacks performed:** none
- **Overall status:** not ready for testing against the public production service

## Risk scale

- **Critical:** likely to permit full administrative compromise or a serious sensitive-data breach.
- **High:** likely to expose another user's data or allow a major security control to be bypassed.
- **Medium:** meaningful weakness requiring additional conditions or offering limited impact.
- **Low:** hardening issue with comparatively small direct impact.

## Findings

### ASA-SEC-01 — Bootstrap administrator credentials are embedded in migrations

- **Severity:** Critical
- **Area:** authentication and secret management
- **Evidence:** `V21__seed_system_admin.sql` and `V22__repair_system_admin_credentials.sql` contain a fixed administrator identifier and fixed password hashes.
- **Threat:** Anyone who can read a public repository can identify the bootstrap administrator account and attempt to recover or reuse the known initial credential. A forced password change reduces risk only after the password has actually been changed.
- **Required remediation:** Remove personal identifiers and fixed credentials from version-controlled migrations. Create the first administrator through a one-time deployment secret or an authenticated bootstrap procedure. Rotate the current administrator password and revoke all existing sessions.
- **Safe verification:** In a disposable database, confirm that migrations contain no real administrator account and that deployment fails safely until a one-time bootstrap secret is supplied.
- **Pass condition:** No reusable administrator credential or personal identifier exists in current source or deployment configuration.

### ASA-SEC-02 — Department managers can request attendance for another department

- **Severity:** High
- **Area:** broken object-level authorisation / IDOR
- **Evidence:** `AdminAttendanceController.todaySummary` accepts any `departmentId`; `AttendanceService.getDaySummary` uses that identifier but receives no authenticated actor on which to enforce department scope.
- **Threat:** A department manager may change the query parameter and obtain employee attendance data belonging to another department.
- **Required remediation:** Resolve the authenticated employee in the service. Restrict department managers to their managed department and allow wider access only to explicitly authorised roles.
- **Safe verification:** Use fictional managers from two test departments. Manager A requests Department B's summary and must receive `403 Forbidden`.
- **Pass condition:** Cross-department requests are rejected and logged.

### ASA-SEC-03 — Messages and attachments are visible to every authenticated account

- **Severity:** High
- **Area:** privacy and broken object-level authorisation
- **Evidence:** message listing methods do not receive the authenticated user; recent messages are returned globally. Attachment retrieval checks authentication but not ownership, department, conversation membership, or note/message visibility.
- **Threat:** Any active account can read all messages and download any attachment whose stored name is available through the message list. This conflicts with private or department-scoped communication expectations.
- **Required remediation:** Define the intended conversation model. Add recipient/conversation/department ownership to messages and enforce membership when listing, sending, deleting, and downloading attachments.
- **Safe verification:** Employee A and Employee B belong to separate authorised scopes. Neither user should list or download the other's private content.
- **Pass condition:** Unauthorised message and attachment requests return `403` or indistinguishable `404`, and the attempt is audited.

### ASA-SEC-04 — Browser access and refresh tokens are stored in `localStorage`

- **Severity:** High
- **Area:** session security
- **Evidence:** `apps/web/src/services/auth.ts` stores both tokens in browser `localStorage`.
- **Threat:** A successful cross-site scripting attack, malicious browser extension, or script supply-chain compromise can read both tokens and maintain access through refresh-token theft.
- **Required remediation:** Prefer a `Secure`, `HttpOnly`, `SameSite` refresh-token cookie with short-lived access tokens held in memory. Apply an effective web Content Security Policy and review all rendered user-controlled content.
- **Safe verification:** Browser JavaScript must not be able to read the refresh credential. Logout and password changes must invalidate server-side sessions.
- **Pass condition:** The refresh credential is unavailable through `window.localStorage` and `document.cookie` JavaScript access.

### ASA-SEC-05 — File validation trusts the client-provided MIME type

- **Severity:** Medium
- **Area:** unrestricted file upload
- **Evidence:** attachment validation uses `MultipartFile.getContentType()` and the filename extension. It does not inspect file signatures or scan content.
- **Threat:** A malicious file may be labelled as an allowed image or document. Download responses use detected content type and may expose users to harmful files.
- **Existing protection:** size is limited to 10 MB; extensions are restricted; filenames are sanitised; generated UUID names and path-normalisation checks reduce traversal risk; `nosniff` is returned.
- **Required remediation:** Detect file type from content, reject active content, scan files, store them outside the application filesystem, and enforce message-level download authorisation.
- **Safe verification:** In a local disposable environment, upload harmless files whose extension/MIME declaration does not match their contents and confirm rejection.
- **Pass condition:** Content mismatch is rejected and no untrusted file is rendered inline.

### ASA-SEC-06 — Rate limiting is local to one process

- **Severity:** Medium
- **Area:** brute-force and denial-of-service resistance
- **Evidence:** `RateLimitService` stores request buckets in memory.
- **Threat:** Limits reset when the service restarts and are not shared if multiple API instances run. Distributed requests can also evade simple per-IP limits.
- **Required remediation:** Use a shared store such as Redis for production and combine IP, account, device/session, and global limits. Alert on repeated authentication failures.
- **Safe verification:** Run two test instances against the same limiter store and confirm that requests are counted across both.
- **Pass condition:** Restarting or changing instances does not reset the security limit.

### ASA-SEC-07 — Automated backend security tests cannot currently start

- **Severity:** High assurance gap
- **Area:** verification process
- **Evidence:** `mvn test` reports that the test profile has no working datasource. The test configuration says Testcontainers will provide PostgreSQL, but the test setup does not currently provide one.
- **Threat:** Authentication, access-control, migration, and endpoint regressions can reach deployment without being detected automatically.
- **Required remediation:** Configure Testcontainers PostgreSQL or another representative disposable database. Add access-control tests for every role and object boundary.
- **Pass condition:** The complete backend test suite starts from a clean environment and passes without production credentials.

### ASA-SEC-08 — Deployment does not set trusted proxy ranges

- **Severity:** Medium
- **Area:** rate-limit identity and logging
- **Evidence:** the production profile leaves `trusted-proxy-cidrs` empty. The limiter then falls back to the immediate remote address.
- **Threat:** Behind a reverse proxy, all users may share one apparent address, causing accidental global lockouts, or the application may not derive the intended client address.
- **Required remediation:** Confirm Render's documented forwarding behaviour and configure only the necessary trusted proxy ranges or platform-supported client-IP mechanism.
- **Pass condition:** Two test clients produce separate trustworthy limiter identities, while forged forwarding headers are ignored.

### ASA-SEC-09 — Sensitive geofence coordinates are committed as production configuration

- **Severity:** Medium
- **Area:** information disclosure and configuration management
- **Evidence:** production latitude, longitude, and radius are stored in `application-production.yml`.
- **Threat:** If these are real workplace coordinates, the public repository reveals a sensitive operational location and makes geofence simulation easier.
- **Required remediation:** Use fictional coordinates for the dissertation or provide production coordinates through protected environment variables. Do not treat geofencing alone as proof of physical presence.
- **Pass condition:** Public source contains no sensitive operational location.

### ASA-SEC-10 — The documented threat model overstates completed assurance

- **Severity:** Medium assurance gap
- **Area:** dissertation accuracy
- **Evidence:** several controls are described with low remaining risk even though their stated tests have not been implemented or executed.
- **Threat:** The dissertation may claim effectiveness without evidence and overlook implementation differences, such as global messages or untested department boundaries.
- **Required remediation:** Mark every control as designed, implemented, tested, passed, failed, or not tested. Assign residual risk only after evidence exists.
- **Pass condition:** Every security claim links to a repeatable test result or is explicitly labelled untested.

## Existing strengths observed

The review also found useful security controls already present:

- BCrypt password hashing with a cost factor of 12;
- short-lived signed access tokens with issuer and expiry validation;
- database-backed live account-status checks;
- token identifiers and blacklist support;
- rotating refresh-session design;
- explicit production CORS origins;
- Swagger disabled in production;
- HTTPS-related response headers;
- server-side ownership checks on employee vacation cancellation;
- department checks for employee management notes;
- upload size, extension, generated filename, and traversal protections;
- database credentials and JWT secret supplied through Render environment variables.

These controls reduce risk but must be tested before their effectiveness is claimed.

## Remediation priority

1. Rotate and remove bootstrap administrator credentials and identifiers.
2. Fix cross-department attendance authorisation.
3. implement private/scoped message and attachment authorisation.
4. Repair the automated backend test environment.
5. Move browser refresh credentials away from `localStorage`.
6. Strengthen upload validation and durable private storage.
7. Use a shared production rate limiter and verified proxy configuration.
8. Remove sensitive location configuration from public source.
9. Test every threat and update the dissertation with genuine evidence.

