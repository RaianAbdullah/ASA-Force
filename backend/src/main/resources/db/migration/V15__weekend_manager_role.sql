-- V15: Add WEEKEND_MANAGER role
-- This role can assign any employee to weekend shifts, view all vacation requests,
-- and receives push notifications when a vacation is approved.

ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;

ALTER TABLE employees ADD CONSTRAINT employees_role_check
    CHECK (role IN (
        'SYSTEM_ADMIN',         -- full platform access
        'MAIN_MANAGER',         -- manages all employees; approves leave
        'DEPARTMENT_MANAGER',   -- manages own department only
        'EMPLOYEE',             -- standard workforce member
        'RESPONSIBLE_OFFICER',  -- receives approved leave info
        'WEEKEND_MANAGER'       -- assigns weekend shifts; views all vacation requests
    ));
