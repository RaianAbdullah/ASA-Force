-- V20: file/image attachments on messages
ALTER TABLE messages
    ALTER COLUMN body DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS attachment_path VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(20)  NULL,   -- 'image' | 'file'
    ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255) NULL;
