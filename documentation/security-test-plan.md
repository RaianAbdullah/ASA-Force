# ASA-Force Security Test Plan

## 1. Authorisation and safety boundary

Testing is authorised only against systems owned and controlled by the ASA-Force project owner.

Use a separate local or staging environment with a disposable PostgreSQL database and fictional data. Do not run brute-force, denial-of-service, destructive database, malware-upload, or automated vulnerability-scanning tests against `asa-force.com`, `api.asa-force.com`, Render infrastructure, classmates, or any third-party service.

Before testing:

1. Create a dedicated test environment and database.
2. Confirm that no production credentials are present.
3. Disable real SMS, email, and push-notification delivery.
4. Create fictional accounts for every role and at least two departments.
5. Back up the test database or make it disposable.
6. Record the Git commit and configuration used.
7. Define a maximum request rate and stop conditions.

## 2. Test identities

Use fictional identities only:

| Account | Role | Department | Purpose |
|---|---|---|---|
| E-A | EMPLOYEE | Test A | Self-access tests |
| E-B | EMPLOYEE | Test B | Cross-user IDOR tests |
| DM-A | DEPARTMENT_MANAGER | Test A | Same-department management |
| DM-B | DEPARTMENT_MANAGER | Test B | Cross-department denial tests |
| MM | MAIN_MANAGER | Management | Organisation-wide authorised tests |
| SA | SYSTEM_ADMIN | Administration | System administration tests |
| PENDING | EMPLOYEE/PENDING | Test A | Unapproved-account tests |
| SUSPENDED | EMPLOYEE/SUSPENDED | Test A | Revocation tests |

Never use a real national identity number or reuse a personal password.

## 3. Test matrix

Record the actual status as `Not run`, `Pass`, `Fail`, or `Blocked`.

| ID | Threat | Safe procedure | Expected result | Status |
|---|---|---|---|---|
| ST-01 | Unauthenticated API access | Request every protected route without a token | `401` or `403`; no private data | Not run |
| ST-02 | Invalid/expired JWT | Use locally generated expired, malformed, and wrongly signed tokens | Rejected without stack trace | Not run |
| ST-03 | Revoked JWT | Log out, then reuse the old access token | `401`; event logged | Not run |
| ST-04 | Refresh-token replay | Rotate a test refresh token, then reuse the old token | Token family revoked | Not run |
| ST-05 | Pending/suspended account | Try valid credentials/tokens for non-active accounts | Access denied | Not run |
| ST-06 | Employee IDOR | E-A requests E-B's vacation, schedule, note, or attendance object | `403`/safe `404` | Not run |
| ST-07 | Department IDOR | DM-A requests Test B's employees, attendance, leave, schedules, and notes | `403`/safe `404` | Not run |
| ST-08 | Role escalation | Employee sends role/department/admin fields in editable requests | Ignored or rejected | Not run |
| ST-09 | Admin route access | Every non-admin role calls every `/v1/admin/**` operation | Denied according to matrix | Not run |
| ST-10 | Vacation workflow bypass | Attempt final approval with wrong role or wrong stage | Denied; state unchanged | Not run |
| ST-11 | Schedule deletion | Employee and wrong department manager attempt deletion | Denied; record remains | Not run |
| ST-12 | Message privacy | E-A attempts to list/download E-B private content | Denied | Not run |
| ST-13 | Management-note privacy | E-A, DM-A, DM-B and admins test the intended visibility rules | Only employee and own department manager permitted | Not run |
| ST-14 | Registration enumeration | Compare responses/timing for existing and nonexistent identifiers | Indistinguishable where appropriate | Not run |
| ST-15 | Login rate limit | Send a small, pre-agreed number of incorrect attempts in staging | `429`/lockout at defined limit | Not run |
| ST-16 | OTP attempts/resend | Use invalid codes and controlled resend requests | Attempt limit and cooldown enforced | Not run |
| ST-17 | Password policy | Test lengths, reused password, wrong current password, and reset expiry | Policy enforced consistently | Not run |
| ST-18 | SQL injection handling | Enter inert SQL-like strings in validated test fields | Treated as data; no query change | Not run |
| ST-19 | Stored/reflected XSS | Submit harmless HTML/script marker strings in text fields | Displayed as text; no execution | Not run |
| ST-20 | Upload validation | Upload harmless mismatched types, oversized files, double extensions, and traversal names | Rejected; nothing executable stored | Not run |
| ST-21 | CORS | Send browser preflight from allowed and unapproved test origins | Only approved origins accepted | Not run |
| ST-22 | Security headers | Inspect web and API responses | Required headers present | Not run |
| ST-23 | Error handling | Submit malformed JSON, invalid UUIDs, and unsupported media types | Safe `4xx`; no internal details | Not run |
| ST-24 | Audit logging | Perform approved and rejected sensitive actions | Actor, target, result and time recorded; no secret values | Not run |
| ST-25 | Database exposure | Review test database network rules and application credentials | Least-privilege and no public direct access | Not run |
| ST-26 | Dependency risk | Run approved dependency scanners locally/CI | Findings reviewed and recorded | Not run |
| ST-27 | Backup recovery | Restore the disposable test database from a test backup | Recovery succeeds and is timed | Not run |
| ST-28 | Geofence trust | Test boundary values and server-side identity/time handling without spoofing a real site | Out-of-bound requests rejected; limitations documented | Not run |

## 4. Role and object coverage

For every endpoint, test all three conditions:

1. **Unauthenticated:** no valid session.
2. **Authenticated but unauthorised:** valid session, wrong role/owner/department.
3. **Authorised:** correct role, owner, department, and workflow state.

Do not accept UI hiding as security evidence. Send requests directly to the staging API and verify the backend decision.

## 5. Evidence record

For each test, record:

- test ID;
- date and tester;
- Git commit and environment;
- fictional account and role;
- endpoint and HTTP method;
- sanitised request description;
- expected status;
- actual status and safe response summary;
- relevant audit-log event;
- screenshot or log reference with tokens and identifiers redacted;
- pass/fail decision;
- issue ID and retest result.

Never place passwords, tokens, OTPs, database URLs, cookies, national IDs, or private messages in dissertation screenshots.

## 6. Stop conditions

Stop testing immediately if:

- production data or credentials appear;
- another real user's information is exposed;
- requests are affecting the public service;
- the database becomes unstable;
- notification traffic reaches a real person;
- request volume could affect Render or another third party;
- a test goes beyond the written authorisation boundary.

## 7. Dissertation reporting

Report both passed and failed tests. A failed test is valid research evidence if it is documented, fixed, and retested.

Use precise language:

- **Designed:** control exists in architecture or documentation only.
- **Implemented:** control is present in code.
- **Tested—passed:** repeatable evidence matches the expected result.
- **Tested—failed:** evidence shows the control did not work.
- **Not tested:** no conclusion about effectiveness can be made.

