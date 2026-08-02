# Security Design

**Status: Stage 1 — Foundation (controls added per stage)**

---

## Security Principles

- **Secure by design** — not added after the fact
- **Least privilege** — every role gets only what it needs
- **Deny by default** — all access is denied unless explicitly granted
- **Defence in depth** — multiple layers, no single point of failure
- **Privacy by design** — collect only what is necessary

## Authentication (Stage 4)

### Access Tokens
- Short-lived JWT (15 minutes)
- Signed with HMAC-SHA512 using a secret from environment variables
- Contains: userId, role, tokenType (ACCESS)
- No sensitive personal data in claims
- Validated on every request: signature, expiry, issuer, audience

### Refresh Tokens
- Cryptographically random (256-bit)
- Stored as BCrypt hash on server (never raw)
- 3-day expiry
- Belong to a token family
- Rotated on every use — reuse detection triggers family revocation

### Session Revocation
Sessions are immediately revoked when:
- User logs out
- Password changed
- Password reset
- Account suspended or deactivated
- Refresh token reuse detected
- Admin forces logout

## Password Security (Stage 3)

- BCrypt with work factor 12
- Minimum 12 characters
- Maximum 128 characters (prevent BCrypt DoS)
- No password hints stored
- Password history (last 5) prevents reuse
- Secure reset via time-limited, single-use, hashed token

## OTP Security (Stage 3)

- 6-digit TOTP-style code
- 5-minute expiry
- 5 attempt maximum then account lock
- 60-second resend cooldown
- Stored as hashed value (never raw)
- Invalidated when new OTP is requested
- Never appears in API responses or production logs

## Access Control (Stage 5)

| Role            | Scope                              |
|-----------------|------------------------------------|
| SUPER_ADMIN     | System-wide                        |
| ADMIN           | Organisation-wide management       |
| DEPT_MANAGER    | Own department only                |
| DIRECT_MANAGER  | Assigned employees only            |
| EMPLOYEE        | Own records only                   |

- Role is stored in the database, not trusted from the JWT claim alone
- Ownership is verified on every operation (not just role)
- IDOR protection: public UUIDs + ownership check

## Rate Limiting (Stage 4)

| Endpoint           | Limit                      |
|--------------------|----------------------------|
| POST /auth/login   | 5 per minute per IP        |
| POST /auth/register| 3 per hour per IP          |
| POST /auth/otp     | 5 per OTP token            |
| POST /attendance   | 1 per day per employee     |

## Audit Logging (Stage 3+)

All sensitive events are logged with:
- Event type
- Actor ID (who did it)
- Target ID (what was affected)
- Server timestamp (never client time)
- Outcome (SUCCESS/FAILURE)
- Correlation ID

Never logged: passwords, OTP codes, tokens, secrets, PII beyond necessary.
