# ASA-Force

ASA-Force is a bilingual workforce management system for employee registration,
department management, scheduling, attendance, leave requests and internal
communication. It includes an Arabic/English web portal, an Expo mobile app and
a Spring Boot API.

## Project structure

```text
ASA-FORCE/
├── apps/
│   ├── web/             React and Vite web portal
│   └── mobile/          React Native and Expo mobile app
├── backend/             Spring Boot API and Flyway migrations
├── documentation/       Architecture, security and deployment documents
├── lib/                 Shared API clients, schemas and database types
├── docker-compose.yml   Local PostgreSQL and Redis services
└── render.yaml          Production deployment configuration
```

## Main features

- Registration with phone verification and administrator approval
- Role-based access for employees, department managers and system administrators
- Department assignment and employee management
- Weekly schedules and shift-swap requests
- Geofenced attendance with server-recorded times
- Leave requests and approval workflows
- Announcements, messages and restricted management notes
- Arabic right-to-left and English left-to-right interfaces
- Audit logging, rate limiting and token revocation

## Technology

| Area | Technology |
| --- | --- |
| Web | React, TypeScript, Vite, Tailwind CSS |
| Mobile | React Native, Expo, TypeScript |
| API | Java 17, Spring Boot, Spring Security |
| Database | PostgreSQL 16, Flyway |
| Authentication | JWT access tokens and rotating refresh tokens |
| Deployment | Render and Docker |

## Local setup

Requirements: Java 17, Maven, Node.js, pnpm and Docker.

```bash
# Install JavaScript dependencies
pnpm install

# Start PostgreSQL and Redis
docker compose up -d postgres redis

# Start the backend
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=development
```

In a second terminal:

```bash
# Start the web portal
pnpm --filter @workspace/asa-web dev

# Or start the mobile app
pnpm --filter @workspace/asa-mobile dev
```

Do not commit production credentials. Database passwords, JWT secrets and other
service credentials must be supplied through environment variables.

## Documentation

- [Architecture](documentation/architecture.md)
- [API design](documentation/api-design.md)
- [Database design](documentation/database-design.md)
- [Security design](documentation/security-design.md)
- [Threat model](documentation/threat-model.md)
- [Initial security assessment](documentation/security-assessment.md)
- [Security test plan](documentation/security-test-plan.md)
- [Deployment guide](documentation/deployment-guide.md)
- [Controlled usability test plan](documentation/usability-test-plan.md)
- [Participant information and agreement template](documentation/participant-information.md)
- [Usability results template](documentation/usability-results-template.md)
- [Incident response](documentation/incident-response.md)
- [Known limitations](documentation/limitations.md)

## Deployment

The production services are defined in `render.yaml`:

- Web portal: `https://asa-force.com`
- API: `https://api.asa-force.com`
- Database: managed PostgreSQL on Render
