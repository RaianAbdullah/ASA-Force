# Deployment Guide

**Status: Stage 1 — Initial guide. Update as stages complete.**

---

## Hosted Environment

Production is deployed through the repository's Render Blueprint:

- **Web**: Render static site at `https://asa-force.com`
- **Backend**: Render web service at `https://api.asa-force.com`
- **Database**: Render PostgreSQL 16

## Local Development

### Prerequisites
- Java 17+ (`java -version`)
- Maven 3.9+ (`mvn -version`)
- Docker + Docker Compose
- Node.js 20+ and pnpm
- Expo Go app on iOS/Android device

### Steps

```bash
# Clone the repo
git clone <repo-url>
cd asa-workforce

# Start PostgreSQL and Redis
docker-compose up postgres redis -d

# Backend
cd backend
cp .env.example .env
# Edit .env with local values
mvn spring-boot:run -Dspring-boot.run.profiles=development

# Mobile (separate terminal)
cd artifacts/asa-mobile
pnpm install
npx expo start
```

## Environment Validation (Production)

The production application MUST fail to start when:
- `JWT_ACCESS_SECRET` is missing or less than 64 characters
- `DATABASE_URL` is missing
- `ALLOWED_CORS_ORIGINS` is missing (no wildcard in production)
- `SPRING_PROFILES_ACTIVE=development` (dev mode in production is a security risk)

This validation will be added in Stage 4.

## Production Checklist

- [ ] HTTPS configured on reverse proxy (Nginx)
- [ ] All environment variables set from secrets manager
- [ ] JWT secrets are >= 64 random characters
- [ ] CORS origins restricted to known domains
- [ ] Swagger UI disabled (`SWAGGER_ENABLED=false`)
- [ ] Production Spring profile active
- [ ] Database runs as limited-privilege user
- [ ] Redis password set and TLS enabled
- [ ] Automated backups configured
- [ ] Log aggregation configured
- [ ] Health monitoring set up
- [ ] Incident response plan reviewed
