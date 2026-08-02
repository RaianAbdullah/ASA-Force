-- ============================================================
-- V6: Rename departments to match ASA structure
--     Add 6th department (Weekend Duty — cross-department access)
--     Add is_cross_department flag
-- ============================================================

-- ── 1. Cross-department flag ──────────────────────────────────
ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS is_cross_department BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 2. Rename the 5 existing departments ─────────────────────
UPDATE departments
SET name = 'Director General', name_ar = 'المدير العام', code = 'GD'
WHERE code = 'OPS';

UPDATE departments
SET name = 'Rapid Response', name_ar = 'الإجراء السريع', code = 'RR'
WHERE code = 'HR';

UPDATE departments
SET name = 'Diplomacy', name_ar = 'الدبلوماسية', code = 'DIP'
WHERE code = 'SEC';

UPDATE departments
SET name = 'Field Operations', name_ar = 'التحرير', code = 'FLD'
WHERE code = 'ADM';

UPDATE departments
SET name = 'Technical Management', name_ar = 'الإدارة الفنية', code = 'TEC'
WHERE code = 'INT';

-- ── 3. Insert Weekend Duty department ────────────────────────
--    is_cross_department = TRUE grants the department manager
--    cross-department assign and leave/vacation read access
INSERT INTO departments (name, name_ar, code, is_cross_department)
VALUES ('Weekend Duty Staff', 'مناوبي نهاية الاسبوع', 'WKD', TRUE)
ON CONFLICT (code) DO NOTHING;
