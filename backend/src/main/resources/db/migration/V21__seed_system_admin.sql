-- V21: Seed initial SYSTEM_ADMIN account
-- Password (BCrypt) = national ID; employee must change on first login.
-- Uses ON CONFLICT DO NOTHING so re-running is safe.

DO $$
DECLARE
    v_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO employees (
        id,
        national_id,
        first_name_ar,
        last_name_ar,
        phone_number,
        password_hash,
        role,
        status,
        must_change_password,
        login_attempts,
        otp_attempts,
        created_at,
        updated_at
    ) VALUES (
        v_id,
        '1085545463',
        'ريان',
        'أبوطالب',
        '0501111539',
        '$2b$12$btUdQ9jB1UXGNq3/HrLln.pBX/Hm4icPtbudAff0JXcYDzUCjrbDi',
        'SYSTEM_ADMIN',
        'ACTIVE',
        TRUE,
        0,
        0,
        NOW(),
        NOW()
    )
    ON CONFLICT (national_id) DO NOTHING;

    -- Also add to employee_roles join table (V18 requirement)
    INSERT INTO employee_roles (employee_id, role)
    SELECT id, 'SYSTEM_ADMIN'
    FROM employees
    WHERE national_id = '1085545463'
    ON CONFLICT DO NOTHING;
END $$;
