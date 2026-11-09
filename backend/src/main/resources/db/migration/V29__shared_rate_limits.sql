CREATE TABLE rate_limit_buckets (
 bucket_key VARCHAR(255) PRIMARY KEY,
 events INTEGER NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_rate_limit_expiry ON rate_limit_buckets(expires_at);
