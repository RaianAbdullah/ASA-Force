-- Repair the bootstrap SYSTEM_ADMIN password created by V21.
--
-- The replacement value is a BCrypt hash for a one-time password communicated
-- directly to the administrator. The application forces a password change
-- immediately after the first successful login.

UPDATE employees
SET password_hash        = '$2y$12$Jo9/2bbVMXTlOHma8qSVIeCMqCzDDAVjcetFrricIeRRL6Zt7T3bC',
    role                 = 'SYSTEM_ADMIN',
    status               = 'ACTIVE',
    must_change_password = TRUE,
    login_attempts       = 0,
    login_locked_until   = NULL,
    otp_code             = NULL,
    otp_expires_at       = NULL,
    otp_attempts         = 0,
    updated_at           = NOW()
WHERE national_id = '1085545463';

INSERT INTO employee_roles (employee_id, role)
SELECT id, 'SYSTEM_ADMIN'
FROM employees
WHERE national_id = '1085545463'
ON CONFLICT DO NOTHING;
