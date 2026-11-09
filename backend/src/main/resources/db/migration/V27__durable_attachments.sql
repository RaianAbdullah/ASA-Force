-- New attachments share the database backup/restore boundary with messages.
CREATE TABLE message_attachments (
 filename VARCHAR(500) PRIMARY KEY,
 content BYTEA NOT NULL,
 CONSTRAINT attachment_size CHECK (octet_length(content) <= 10485760)
);
