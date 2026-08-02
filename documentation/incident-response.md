# Incident Response Plan

**Status: Stage 1 — Initial plan. Update as the system is implemented.**

---

## Severity Levels

| Level    | Example                                    | Response Time |
|----------|--------------------------------------------|---------------|
| Critical | Data breach, privilege escalation confirmed | Immediate     |
| High     | Suspicious login patterns, token reuse     | < 1 hour      |
| Medium   | Multiple failed OTPs, brute force detected | < 4 hours     |
| Low      | Unusual access time, unknown device        | Next business day |

## Response Process

### 1. Detect
- Security alert dashboard (Admin UI)
- Audit log anomaly
- User reports suspicious activity

### 2. Contain
- Force logout: `POST /api/v1/admin/users/{id}/logout-all`
- Suspend account: `POST /api/v1/admin/users/{id}/suspend`
- Revoke token family (automatic on reuse detection)

### 3. Investigate
- Review audit log for actor, timeline, affected records
- Identify scope: which accounts, which data
- Preserve evidence (do NOT delete audit records)

### 4. Remediate
- Fix the vulnerability
- Notify affected employees
- Reset credentials if required
- Restore from backup if data was tampered

### 5. Learn
- Document the incident
- Update threat model
- Add automated test for the exploited path
- Update security controls

## Contact

- System Administrator: [contact TBD]
- Security Team: [contact TBD]
- Data Protection Officer: [contact TBD]
