-- V4: Security hardening + admin approval workflow + push notifications

-- ── Login brute-force tracking ───────────────────────────────────────────────
ALTER TABLE employees ADD COLUMN IF NOT EXISTS login_attempts   SMALLINT    NOT NULL DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS login_locked_until TIMESTAMPTZ;

-- ── Admin review fields ───────────────────────────────────────────────────────
ALTER TABLE employees ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS reviewed_by      UUID        REFERENCES employees(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS reviewed_at      TIMESTAMPTZ;

-- ── Push notification tokens ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    token       TEXT        NOT NULL UNIQUE,
    platform    VARCHAR(10) NOT NULL DEFAULT 'unknown',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_employee ON push_tokens(employee_id);

-- ── Index for fast pending-approval queries ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_role   ON employees(role);
