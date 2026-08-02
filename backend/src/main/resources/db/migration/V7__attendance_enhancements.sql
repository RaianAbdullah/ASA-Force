-- ============================================================
-- V7: Attendance enhancements for Stage 6
--     Adds check-out GPS, late minutes, geofence override flag
-- ============================================================

ALTER TABLE attendance
    ADD COLUMN IF NOT EXISTS check_out_latitude   DECIMAL(10,7),
    ADD COLUMN IF NOT EXISTS check_out_longitude  DECIMAL(10,7),
    ADD COLUMN IF NOT EXISTS minutes_late         SMALLINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS geofence_override    BOOLEAN  NOT NULL DEFAULT FALSE;

-- Index for fast "today's attendance" admin dashboard query
CREATE INDEX IF NOT EXISTS idx_attendance_date_dept
    ON attendance(attendance_date, employee_id);
