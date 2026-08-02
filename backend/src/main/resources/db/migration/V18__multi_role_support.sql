-- V18: multi-role support
-- Each employee keeps their primary 'role' column (backwards-compat) and gains
-- a separate employee_roles join table that holds the full set of assigned roles.

CREATE TABLE IF NOT EXISTS employee_roles (
    employee_id UUID        NOT NULL,
    role        VARCHAR(30) NOT NULL,
    CONSTRAINT fk_employee_roles_employee
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    CONSTRAINT uq_employee_role UNIQUE (employee_id, role)
);

-- Seed: every existing employee gets their current primary role in the new table.
INSERT INTO employee_roles (employee_id, role)
SELECT id, role FROM employees
ON CONFLICT DO NOTHING;
