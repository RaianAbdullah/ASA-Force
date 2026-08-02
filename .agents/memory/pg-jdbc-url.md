---
name: PostgreSQL JDBC URL format on Replit
description: How to connect Spring Boot / Hibernate to Replit's PostgreSQL using env vars
---

The rule: never construct `jdbc:${DATABASE_URL}`.

**Why:** Replit's `DATABASE_URL` is `postgresql://user:password@host/db?params`. HikariCP / the PostgreSQL JDBC driver fails to parse the embedded credentials when you just prepend `jdbc:` — it misreads the port field as `password@host`.

**How to apply:** Use the individual `PG*` vars Replit also injects:
```yaml
spring:
  datasource:
    url: "jdbc:postgresql://${PGHOST}:${PGPORT:5432}/${PGDATABASE}"
    username: ${PGUSER}
    password: ${PGPASSWORD}
```
These are always present alongside `DATABASE_URL` in Replit's PostgreSQL environment.
