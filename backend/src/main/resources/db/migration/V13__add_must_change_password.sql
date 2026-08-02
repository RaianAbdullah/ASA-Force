-- V13: add must_change_password flag for admin-created accounts
-- Employees created directly by admin are set ACTIVE immediately but must
-- set their own password on first login. This flag drives that flow.

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
