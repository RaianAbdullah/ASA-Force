-- V11: Password security enhancements
-- 1. Track when password was last changed (enables future "force rotation" policies)
-- 2. Password reset tokens table for forgot-password flow

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ;

CREATE TABLE password_reset_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,   -- SHA-256 hex of raw token
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prt_employee ON password_reset_tokens(employee_id);
CREATE INDEX idx_prt_expires  ON password_reset_tokens(expires_at);
