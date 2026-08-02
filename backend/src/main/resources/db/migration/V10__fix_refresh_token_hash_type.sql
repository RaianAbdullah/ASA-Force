-- V10: Fix token_hash column type CHAR(64) → VARCHAR(64)
-- Hibernate maps @Column(length=64) to varchar; CHAR creates bpchar which fails schema validation.
ALTER TABLE refresh_token_sessions
    ALTER COLUMN token_hash TYPE VARCHAR(64) USING token_hash::VARCHAR;
