-- V9: Refresh token sessions for rotating refresh tokens
-- Each row represents one issued refresh token.
-- token_hash: SHA-256 hex of the raw token (raw token never stored).
-- token_family: UUID shared across a rotation chain — used for reuse detection.

CREATE TABLE refresh_token_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    token_hash      VARCHAR(64) NOT NULL UNIQUE,   -- SHA-256 hex (256 bit / 4 = 64 hex chars)
    token_family    UUID        NOT NULL,
    device_info     VARCHAR(255),
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    replaced_by_id  UUID        REFERENCES refresh_token_sessions(id),
    reuse_detected  BOOLEAN     NOT NULL DEFAULT FALSE,
    last_used_at    TIMESTAMPTZ
);

CREATE INDEX idx_rt_employee ON refresh_token_sessions(employee_id);
CREATE INDEX idx_rt_family   ON refresh_token_sessions(token_family);
CREATE INDEX idx_rt_expires  ON refresh_token_sessions(expires_at);
