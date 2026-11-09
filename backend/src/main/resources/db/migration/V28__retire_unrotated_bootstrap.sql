-- Disable unrotated privileged bootstrap credentials. Changed passwords are preserved.
UPDATE employees SET status = 'SUSPENDED', password_changed_at = CURRENT_TIMESTAMP
WHERE role = 'SYSTEM_ADMIN' AND must_change_password = TRUE;
UPDATE refresh_token_sessions SET revoked_at = CURRENT_TIMESTAMP
WHERE revoked_at IS NULL AND employee_id IN
 (SELECT id FROM employees WHERE role = 'SYSTEM_ADMIN' AND status = 'SUSPENDED');
