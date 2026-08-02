---
name: Hibernate schema validation vs PostgreSQL native types
description: Which PostgreSQL column types cause Hibernate validate to fail and how to fix them
---

Hibernate's `ddl-auto: validate` rejects columns whose DB type doesn't match what Hibernate expects for the Java type.

**Known mismatches:**
| SQL DDL type | PostgreSQL stores as | Hibernate expects | Fix |
|---|---|---|---|
| `CHAR(n)` | `bpchar` | `varchar(n)` | ALTER to `VARCHAR(n)` |
| `INET` | `inet` (Types#OTHER) | `varchar(45)` | ALTER to `TEXT` |

**Why:** Hibernate maps `String` → `varchar`; PostgreSQL's `CHAR` stores as `bpchar` and `INET` is a native network type — neither matches.

**How to apply:** When V1 migration already ran with these types, add a subsequent Flyway migration:
```sql
ALTER TABLE audit_logs ALTER COLUMN ip_address TYPE TEXT USING ip_address::TEXT;
ALTER TABLE employees ALTER COLUMN national_id TYPE VARCHAR(10);
ALTER TABLE employees ALTER COLUMN otp_code    TYPE VARCHAR(6);
```
Going forward: use `VARCHAR` / `TEXT` in all Flyway DDL for String-mapped columns; avoid `CHAR(n)` and `INET`.
