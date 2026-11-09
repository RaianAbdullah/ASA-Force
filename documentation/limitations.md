# Current limitations

Updated November 2026. See [security remediation and upgrade instructions](security-remediation.md) for implemented controls and migration requirements.

- Nafath, device attestation, privileged MFA and certificate pinning remain future integrations; no verification success is simulated.
- The credential delivery adapter needs an organisation-controlled HTTPS SMS gateway and deployment secrets. Real delivery has not been validated by local tests.
- Content validation is not antivirus scanning. New attachments are database-backed; legacy disk attachments still require a separate backup until migrated.
- Production proxy CIDRs and geofence coordinates must be supplied by the operator. Geofencing is a coordinate check, not proof of physical presence.
- Scheduling currently supports Sunday-start weeks and same-day shifts. Overnight shift workflows are explicitly unsupported.
- Department messages are visible to their department, the sender and senior management. Old messages with no recorded audience are limited to the sender and senior management.
- Automated unit/integration tests do not establish usability, production throughput, real-device behaviour or recovery time. Representative field studies, load tests and restore drills remain necessary.
- Current-source credential removal does not erase historical Git objects or rotate live secrets. Follow the controlled upgrade instructions before deployment.
