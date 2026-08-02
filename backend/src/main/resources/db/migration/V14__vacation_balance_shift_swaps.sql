-- V14: vacation balance per employee + shift swap requests

-- Add vacation days allowance to employees (default 21 days/year)
ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS vacation_days_per_year INTEGER NOT NULL DEFAULT 21;

-- Shift swap requests between employees
CREATE TABLE IF NOT EXISTS shift_swap_requests (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id        UUID        NOT NULL REFERENCES employees(id),
    target_id           UUID        NOT NULL REFERENCES employees(id),
    requester_week_start DATE        NOT NULL,
    target_week_start   DATE        NOT NULL,
    reason              TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by         UUID        REFERENCES employees(id),
    review_notes        TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swap_requester  ON shift_swap_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_swap_target     ON shift_swap_requests(target_id);
CREATE INDEX IF NOT EXISTS idx_swap_status     ON shift_swap_requests(status);
