-- ============================================================
-- V5: Five-role system + department manager + richer dept names
-- ============================================================

-- ── 1. Roles ─────────────────────────────────────────────────
-- Drop old CHECK and add the five-role constraint
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;

-- Migrate existing values before tightening the constraint
UPDATE employees SET role = 'SYSTEM_ADMIN'       WHERE role = 'ADMIN';
UPDATE employees SET role = 'DEPARTMENT_MANAGER'  WHERE role = 'SUPERVISOR';

ALTER TABLE employees ADD CONSTRAINT employees_role_check
    CHECK (role IN (
        'SYSTEM_ADMIN',         -- full platform access, manages departments & security settings
        'MAIN_MANAGER',         -- manages employees, approves leave, monitors all departments
        'DEPARTMENT_MANAGER',   -- manages and views own department only
        'EMPLOYEE',             -- standard workforce member
        'RESPONSIBLE_OFFICER'   -- receives approved leave info and handles follow-up
    ));

-- ── 2. Department manager reference ──────────────────────────
ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_departments_manager ON departments(manager_id);

-- ── 3. Reseed departments with full bilingual names ───────────
-- Update the 5 initial departments seeded in V1 with richer English names
UPDATE departments SET name = 'Security Operations'      WHERE code = 'OPS';
UPDATE departments SET name = 'Human Resources'          WHERE code = 'HR';
UPDATE departments SET name = 'General Security'         WHERE code = 'SEC';
UPDATE departments SET name = 'Administration & Support' WHERE code = 'ADM';
UPDATE departments SET name = 'Intelligence & Analysis'  WHERE code = 'INT';

-- Richer Arabic names
UPDATE departments SET name_ar = 'عمليات الأمن'           WHERE code = 'OPS';
UPDATE departments SET name_ar = 'الموارد البشرية'         WHERE code = 'HR';
UPDATE departments SET name_ar = 'الأمن العام'             WHERE code = 'SEC';
UPDATE departments SET name_ar = 'الإدارة والدعم'          WHERE code = 'ADM';
UPDATE departments SET name_ar = 'الاستخبارات والتحليل'   WHERE code = 'INT';
