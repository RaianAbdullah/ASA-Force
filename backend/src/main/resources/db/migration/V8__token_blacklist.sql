-- ============================================================
-- V8: Token blacklist for JWT revocation
--     Stores jti (JWT ID) of revoked tokens until they expire.
--     Rows are cleaned up automatically once past expires_at.
-- ============================================================

CREATE TABLE token_blacklist (
    jti            UUID                     PRIMARY KEY,
    employee_id    UUID                     REFERENCES employees(id) ON DELETE CASCADE,
    reason         VARCHAR(50)              NOT NULL DEFAULT 'LOGOUT',
    blacklisted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at     TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Fast lookup on every authenticated request
CREATE INDEX idx_token_blacklist_jti     ON token_blacklist(jti);
-- Cleanup scheduler needs this
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
