-- V17: Group chat messages — any active employee can send and receive
CREATE TABLE IF NOT EXISTS messages (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id  UUID        NOT NULL REFERENCES employees(id),
    body       TEXT        NOT NULL,
    sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
