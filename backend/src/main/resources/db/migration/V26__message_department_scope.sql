-- Do not guess the audience of historical messages. NULL means sender/management only.
ALTER TABLE messages ADD COLUMN department_id UUID REFERENCES departments(id);
CREATE INDEX idx_messages_department_sent ON messages(department_id, sent_at);
CREATE INDEX idx_messages_attachment ON messages(attachment_path);
