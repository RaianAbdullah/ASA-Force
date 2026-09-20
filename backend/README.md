# ASA-Force — Backend

Spring Boot 3.4 · Java 17 · PostgreSQL · Redis · JWT

---

## Overview

This is the backend API for the **ASA Workforce** secure mobile attendance system. It serves the React Native Expo mobile application.

## Technology Stack

| Component       | Technology                          |
|-----------------|-------------------------------------|
| Language        | Java 17 (GraalVM compatible)        |
| Framework       | Spring Boot 3.4.0                   |
| Security        | Spring Security 6, JWT (jjwt 0.12)  |
| Database        | PostgreSQL 16 + Spring Data JPA     |
| Migrations      | Flyway                              |
| Session         | Rotating refresh-token records      |
| API Docs        | SpringDoc OpenAPI (dev only)        |
| Testing         | JUnit 5, Mockito, Testcontainers    |
| Build           | Maven 3.9                           |

## Quick Start (Local Development)

```bash
# 1. Ensure Java 17+ and Maven 3.9+ are installed
java -version
mvn -version

# 2. Copy environment file
cp .env.example .env
# Edit .env with your values

# 3. Start dependencies (PostgreSQL + Redis)
docker-compose up postgres redis -d

# 4. Run the application
mvn spring-boot:run -Dspring-boot.run.profiles=development
```

## API Base URL

All endpoints are served under `/api`:

```
Development:  http://localhost:8080/api
Production:   https://api.asa-force.com/api
```

## Implemented Modules

- Registration, OTP verification, login, password reset, JWT refresh and session revocation
- Role-based employee administration, departments and restricted management notes
- Weekly schedules, weekend duty and shift swaps
- Geofenced attendance and administrative attendance summaries
- Vacation balances and multi-stage approvals
- Announcements, replies, messages, attachments and Expo push-token registration
- Audit logging, rate limiting, token blacklisting and OpenAPI documentation

## Running Tests

```bash
mvn test
mvn test -Dtest=HealthControllerTest
```

The test profile uses an in-memory H2 database. PostgreSQL-specific Flyway
migrations are exercised separately against PostgreSQL during deployment or
integration testing.

## Package Structure

```
com.asa.workforce/
├── config/          Spring & security configuration
├── security/        JWT filters, authentication providers
├── auth/            Registration, login, OTP, sessions
├── user/            User management, profiles
├── department/      Department CRUD, assignment
├── schedule/        Weekly & weekend schedules
├── attendance/      Check-in, classification
├── vacation/        Vacation requests, workflow
├── notification/    In-app notifications
├── audit/           Audit log, security events
├── session/         Active session management
├── common/          Shared DTOs, utilities, exception handlers
└── exception/       Global exception handling
```

## Security Notes

- Passwords hashed with BCrypt (strength 12)
- JWT access tokens expire in 15 minutes
- Refresh tokens rotate on every use
- Refresh token reuse triggers family revocation
- All auth events are audit-logged
- No sensitive data in logs or API responses
- Spring Security configured stateless (no HttpSession)
