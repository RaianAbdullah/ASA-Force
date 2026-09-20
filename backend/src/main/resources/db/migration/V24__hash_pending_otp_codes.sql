ALTER TABLE employees ALTER COLUMN otp_code TYPE VARCHAR(100);

-- Existing plaintext OTPs cannot be safely migrated. Expire them so users request a new one.
UPDATE employees
SET otp_code = NULL, otp_expires_at = NULL, otp_attempts = 0
WHERE otp_code IS NOT NULL;
