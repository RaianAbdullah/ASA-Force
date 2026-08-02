---
name: Flyway migration immutability
description: What to do when a Flyway migration file is edited after it was already applied to the DB
---

## Rule
Never edit a Flyway migration SQL file after it has been applied to the database.

**Why:** Flyway stores a checksum of every applied migration in `flyway_schema_history`. If the file changes, the next startup throws `FlywayValidateException: Migration checksum mismatch` and the server refuses to start.

## How to apply
- Discovered at startup by a `FlywayValidateException` naming the version and showing two different checksums.
- **Fix path:**
  1. Create a new `Vn+1__description.sql` that applies the desired change (e.g. `ALTER TABLE … ALTER COLUMN … TYPE VARCHAR`).
  2. Run `mvn flyway:repair` against the live DB to update the stored checksum for the edited migration so it matches the file on disk.
  3. Restart the server — Flyway will validate OK and apply the new migration.
- Command used in this project (Replit — env vars already set):
  ```
  cd backend && mvn flyway:repair \
    -Dflyway.url="jdbc:postgresql://${PGHOST}:${PGPORT:-5432}/${PGDATABASE}" \
    -Dflyway.user="${PGUSER}" \
    -Dflyway.password="${PGPASSWORD}" \
    -Dflyway.locations=classpath:db/migration
  ```
- Common trigger: fixing a CHAR(n) → VARCHAR(n) column type in an already-applied migration (the CHAR→bpchar Hibernate mismatch pattern).
