-- V12: Two-stage vacation approval (dept manager → main manager)

-- Drop old check constraint so the status UPDATE below isn't blocked
ALTER TABLE vacation_requests DROP CONSTRAINT IF EXISTS vacation_requests_status_check;

-- Expand status column to fit new longer values
ALTER TABLE vacation_requests ALTER COLUMN status TYPE VARCHAR(30);

-- Department-manager review columns (first stage)
ALTER TABLE vacation_requests
    ADD COLUMN IF NOT EXISTS dept_reviewed_by   UUID         REFERENCES employees(id),
    ADD COLUMN IF NOT EXISTS dept_reviewed_at   TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS dept_review_notes  TEXT;

-- Migrate any existing PENDING rows to the first-stage status
UPDATE vacation_requests SET status = 'PENDING_DEPT_MANAGER' WHERE status = 'PENDING';

-- Re-add constraint with the full two-stage value set
ALTER TABLE vacation_requests ADD CONSTRAINT vacation_requests_status_check
    CHECK (status IN ('PENDING_DEPT_MANAGER', 'PENDING_MAIN_MANAGER', 'APPROVED', 'REJECTED', 'CANCELLED'));
