# Threat Model

**Status: Stage 1 — Documented. Controls implemented per stage.**

Using STRIDE methodology.

---

## High-Priority Threats

### T-01: Credential Brute Force
| Field          | Value |
|----------------|-------|
| Asset          | User accounts |
| Actor          | External attacker, malicious insider |
| Method         | Automated login attempts |
| Likelihood     | High |
| Impact         | High (account takeover) |
| Prevention     | Rate limiting (5/min/IP), account lockout (temp), BCrypt slow hash |
| Detection      | Failed login counter, security alert, audit log |
| Recovery       | Admin unlock, forced password reset |
| Remaining Risk | Low — if rate limiting and lockout are correctly implemented |
| Test           | Automated test: > 5 login attempts triggers lockout |

### T-02: Refresh Token Replay
| Field          | Value |
|----------------|-------|
| Asset          | User sessions |
| Actor          | Attacker with stolen token |
| Method         | Replay old refresh token after legitimate rotation |
| Likelihood     | Medium |
| Impact         | High (persistent session access) |
| Prevention     | Token family tracking, reuse detection → full family revocation |
| Detection      | Reuse event triggers security alert and audit log |
| Recovery       | All sessions revoked, user must re-login |
| Remaining Risk | Low — if family revocation is correctly implemented |
| Test           | Use revoked token → expect 401 and all sessions revoked |

### T-03: Attendance Fraud
| Field          | Value |
|----------------|-------|
| Asset          | Attendance records |
| Actor          | Employee, colluding employees |
| Method         | Check in on behalf of another; GPS spoofing; time manipulation |
| Likelihood     | Medium |
| Impact         | Medium (payroll fraud, compliance) |
| Prevention     | Server-side time; device session binding; unique-per-day DB constraint |
| Detection      | Attendance audit log, anomaly detection |
| Recovery       | Admin correction with recorded reason |
| Remaining Risk | Medium — geofencing and QR reduce risk but cannot eliminate it |
| Test           | Submit check-in for another employee ID → expect 403 |

### T-04: IDOR (Insecure Direct Object Reference)
| Field          | Value |
|----------------|-------|
| Asset          | Employee records, attendance, vacation data |
| Actor          | Employee, rogue manager |
| Method         | Access another employee's data by guessing/modifying ID |
| Likelihood     | Medium |
| Impact         | High (privacy breach) |
| Prevention     | Public UUIDs (non-guessable) + ownership check on every request |
| Detection      | Audit log for cross-employee access attempts |
| Recovery       | Audit and report |
| Remaining Risk | Low — if ownership is verified on every request |
| Test           | Employee A accesses Employee B's records → expect 403 |

### T-05: Privilege Escalation
| Field          | Value |
|----------------|-------|
| Asset          | Role assignments, admin functions |
| Actor          | Employee, manager |
| Method         | Modify own role in request; call admin-only endpoints |
| Likelihood     | Medium |
| Impact         | Critical |
| Prevention     | Role from DB (not JWT); deny-by-default; user cannot change own role |
| Detection      | Audit log, security alert |
| Recovery       | Review and revoke |
| Remaining Risk | Low — if deny-by-default is enforced |
| Test           | Employee calls admin endpoint → 403; user changes own role → 403 |

### T-06: SQL Injection
| Field          | Value |
|----------------|-------|
| Asset          | Database |
| Actor          | External attacker |
| Method         | Malicious input in API fields |
| Likelihood     | Low (with JPA) |
| Impact         | Critical |
| Prevention     | Spring Data JPA parameterised queries; input validation; bean validation |
| Detection      | Application logs, WAF |
| Recovery       | Patch, audit, report |
| Remaining Risk | Very Low — JPA prevents raw SQL construction from user input |
| Test           | SQL injection payloads in login fields → no effect on query |

### T-07: Stolen Phone / Token Theft
| Field          | Value |
|----------------|-------|
| Asset          | Active sessions, Expo SecureStore tokens |
| Actor          | Physical attacker, malware |
| Method         | Extract token from device and use on another device |
| Likelihood     | Medium |
| Impact         | High |
| Prevention     | Short JWT expiry (15 min); active session visibility; force logout API |
| Detection      | New device login notification |
| Recovery       | User or admin can force logout all sessions |
| Remaining Risk | Medium — short expiry limits window; session revocation helps |
| Test           | Use token from revoked session → 401 |

---

## Additional Threats (to be detailed in Stage 12)

- OTP guessing and interception
- OTP enumeration
- Mass assignment
- Malicious file upload
- QR code replay
- Denial of service
- Vulnerable dependencies
- Exposed secrets
- Audit log tampering
- Database ransomware
- Insider data misuse
