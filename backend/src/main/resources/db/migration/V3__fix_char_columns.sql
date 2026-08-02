-- CHAR(n) in PostgreSQL is stored as bpchar; Hibernate validates it as varchar.
-- Convert all fixed-char columns to VARCHAR so the types align.
ALTER TABLE employees ALTER COLUMN national_id TYPE VARCHAR(10);
ALTER TABLE employees ALTER COLUMN otp_code    TYPE VARCHAR(6);
