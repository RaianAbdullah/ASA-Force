# ASA-Force

**Secure Workforce Mobile Application System**

A government-grade workforce management system for secure attendance tracking, scheduling, and vacation management.

---

## Architecture

```
asa-workforce/
├── backend/          Spring Boot 3.4 API (Java 17)
├── artifacts/
│   └── asa-mobile/   React Native / Expo mobile app (TypeScript)
├── documentation/    Architecture, security, threat model, API design
├── docker-compose.yml  Local development environment
└── README.md
```

## Components

| Component     | Technology                    | Status      |
|---------------|-------------------------------|-------------|
| Mobile App    | React Native, Expo, TypeScript | Stage 1 ✅  |
| Backend API   | Spring Boot 3.4, Java 17      | Stage 1 ✅  |
| Database      | PostgreSQL 16                 | Stage 2 🔲  |
| Cache/Session | Redis 7                       | Stage 3 🔲  |
| Auth          | JWT + Refresh Tokens          | Stage 4 🔲  |

## Key Features (Planned)

- **Employee Management** — Registration, OTP verification, admin approval
- **Weekly Schedules** — Published by admin, change notifications
- **Attendance Check-In** — Server-side time, QR & geofence optional
- **Vacation Requests** — Multi-level approval workflow
- **Security** — JWT + rotating refresh tokens, audit logs, rate limiting
- **i18n** — Arabic (RTL) and English support

## Quick Start

See [backend/README.md](./backend/README.md) for backend setup instructions.

```bash
# Start local dependencies
docker-compose up postgres redis -d

# Run backend
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=development

# Run mobile app (in another terminal)
cd artifacts/asa-mobile && npx expo start
```

## Security

This system is designed security-first following:
- OWASP ASVS Level 2
- OWASP API Security Top 10
- OWASP Mobile Application Security
- NIST SP 800-63B authentication guidelines

See [documentation/security-design.md](./documentation/security-design.md) for details.

## Documentation

| Document                    | Description                          |
|-----------------------------|--------------------------------------|
| [architecture.md](./documentation/architecture.md)       | System architecture overview |
| [security-design.md](./documentation/security-design.md) | Security controls and design |
| [threat-model.md](./documentation/threat-model.md)       | STRIDE threat analysis |
| [api-design.md](./documentation/api-design.md)           | API design decisions |
| [database-design.md](./documentation/database-design.md) | Schema and entity design |
| [deployment-guide.md](./documentation/deployment-guide.md) | Production deployment |
| [limitations.md](./documentation/limitations.md)         | Known limitations |

## Development Stages

| Stage | Name                    | Status      |
|-------|------------------------|-------------|
| 1     | Project Foundation      | ✅ Complete |
| 2     | Database & Core Models  | 🔲 Next     |
| 3     | Secure Registration     | 🔲 Planned  |
| 4     | JWT Authentication      | 🔲 Planned  |
| 5     | Authorization           | 🔲 Planned  |
| 6     | Departments             | 🔲 Planned  |
| 7     | Schedules               | 🔲 Planned  |
| 8     | Attendance              | 🔲 Planned  |
| 9     | Vacation Requests       | 🔲 Planned  |
| 10    | Mobile Completion       | 🔲 Planned  |
| 11    | Optional Controls       | 🔲 Planned  |
| 12    | Security Hardening      | 🔲 Planned  |
| 13    | Documentation & Evidence| 🔲 Planned  |
