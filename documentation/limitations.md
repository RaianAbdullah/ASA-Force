# Known Limitations

This document honestly records what is not yet implemented, designed only, or has known shortcomings.

Last updated: Stage 1

---

## Stage 1 Limitations

| Area             | Limitation                                             | Planned For |
|------------------|-------------------------------------------------------|-------------|
| Authentication   | No JWT auth — all endpoints are currently public      | Stage 4     |
| Database         | No schema, no migrations                              | Stage 2     |
| Registration     | Not implemented                                       | Stage 3     |
| OTP              | Not implemented                                       | Stage 3     |
| Rate Limiting    | Not implemented                                       | Stage 4     |
| Redis            | Not connected                                         | Stage 3     |
| Notifications    | Not implemented                                       | Stage 3     |
| Schedules        | Not implemented                                       | Stage 7     |
| Attendance       | Not implemented                                       | Stage 8     |
| Vacation         | Not implemented                                       | Stage 9     |
| QR check-in      | Designed only                                         | Stage 11    |
| Geofencing       | Designed only                                         | Stage 11    |
| Push notifications| Not implemented                                      | Stage 11    |
| Biometric unlock | Not implemented                                       | Stage 11    |
| i18n (full)      | Arabic text shown statically, no runtime switching    | Stage 10    |

## Permanent Limitations

- Geofencing does not guarantee physical presence — it is a risk signal only
- QR check-in does not eliminate attendance fraud — dynamic QR reduces but does not eliminate it
- GPS spoofing cannot be fully detected on mobile without additional hardware signals
- Short JWT expiry (15 min) means revoked accounts can access the system for up to 15 minutes after revocation — mitigated by checking DB status on sensitive operations
