-- V16: Announcements and replies
-- Managers post announcements; any active employee can reply.

CREATE TABLE IF NOT EXISTS announcements (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(200) NOT NULL,
    body        TEXT         NOT NULL,
    pinned      BOOLEAN      NOT NULL DEFAULT false,
    created_by  UUID         NOT NULL REFERENCES employees(id),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

CREATE TABLE IF NOT EXISTS announcement_replies (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID        NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    author_id       UUID        NOT NULL REFERENCES employees(id),
    body            TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcement_replies_ann ON announcement_replies(announcement_id, created_at ASC);
