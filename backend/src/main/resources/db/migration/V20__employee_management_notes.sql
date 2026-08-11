CREATE TABLE employee_management_notes (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID         NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    author_id   UUID         NOT NULL REFERENCES employees(id),
    category    VARCHAR(30)  NOT NULL,
    note        TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT employee_management_notes_category_check
        CHECK (category IN ('GENERAL', 'PERFORMANCE', 'CONDUCT', 'COMMENDATION')),
    CONSTRAINT employee_management_notes_note_not_blank
        CHECK (char_length(trim(note)) BETWEEN 1 AND 2000)
);

CREATE INDEX idx_employee_management_notes_employee_created
    ON employee_management_notes(employee_id, created_at DESC);

