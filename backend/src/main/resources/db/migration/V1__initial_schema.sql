-- ============================================================
-- ASA Workforce — Initial Database Schema
-- Stage 2: Core tables
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Departments ─────────────────────────────────────────────
CREATE TABLE departments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL,
    name_ar     VARCHAR(150) NOT NULL,
    code        VARCHAR(20)  NOT NULL UNIQUE,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Employees ───────────────────────────────────────────────
CREATE TABLE employees (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    national_id     CHAR(10)    NOT NULL UNIQUE,
    first_name_ar   VARCHAR(100) NOT NULL,
    last_name_ar    VARCHAR(100) NOT NULL,
    phone_number    VARCHAR(20)  NOT NULL,
    department_id   UUID         REFERENCES departments(id) ON DELETE SET NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20)  NOT NULL DEFAULT 'EMPLOYEE'
                        CHECK (role IN ('ADMIN', 'SUPERVISOR', 'EMPLOYEE')),
    status          VARCHAR(30)  NOT NULL DEFAULT 'PENDING_VERIFICATION'
                        CHECK (status IN (
                            'PENDING_VERIFICATION',
                            'PENDING_APPROVAL',
                            'ACTIVE',
                            'SUSPENDED',
                            'REJECTED'
                        )),
    -- OTP fields (Stage 3 — stored in DB; migrated to Redis in Stage 4)
    otp_code        VARCHAR(6),
    otp_expires_at  TIMESTAMPTZ,
    otp_attempts    SMALLINT     NOT NULL DEFAULT 0,
    -- Audit
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_national_id ON employees(national_id);
CREATE INDEX idx_employees_status      ON employees(status);
CREATE INDEX idx_employees_department  ON employees(department_id);

-- ── Weekly Schedules ────────────────────────────────────────
CREATE TABLE weekly_schedules (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    week_start      DATE        NOT NULL,
    work_days       VARCHAR(20) NOT NULL,   -- e.g. 'MON,TUE,WED,THU,SUN'
    shift_start     TIME        NOT NULL,
    shift_end       TIME        NOT NULL,
    is_weekend_duty BOOLEAN     NOT NULL DEFAULT FALSE,
    notes           TEXT,
    created_by      UUID        REFERENCES employees(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, week_start)
);

CREATE INDEX idx_schedules_employee   ON weekly_schedules(employee_id);
CREATE INDEX idx_schedules_week_start ON weekly_schedules(week_start);

-- ── Attendance ──────────────────────────────────────────────
CREATE TABLE attendance (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date     DATE        NOT NULL,
    check_in_time       TIMESTAMPTZ,
    check_in_latitude   DECIMAL(10,7),
    check_in_longitude  DECIMAL(10,7),
    check_out_time      TIMESTAMPTZ,
    status              VARCHAR(20) NOT NULL DEFAULT 'ABSENT'
                            CHECK (status IN ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED', 'HOLIDAY')),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (employee_id, attendance_date)
);

CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date     ON attendance(attendance_date);

-- ── Vacation Requests ───────────────────────────────────────
CREATE TABLE vacation_requests (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date      DATE        NOT NULL,
    end_date        DATE        NOT NULL,
    reason          TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    reviewed_by     UUID        REFERENCES employees(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    review_notes    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

CREATE INDEX idx_vacation_employee ON vacation_requests(employee_id);
CREATE INDEX idx_vacation_status   ON vacation_requests(status);

-- ── Audit Logs ──────────────────────────────────────────────
CREATE TABLE audit_logs (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id        UUID        REFERENCES employees(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50),
    resource_id     UUID,
    details         JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor     ON audit_logs(actor_id);
CREATE INDEX idx_audit_action    ON audit_logs(action);
CREATE INDEX idx_audit_created   ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_resource  ON audit_logs(resource_type, resource_id);

-- ── Seed: Default departments ────────────────────────────────
INSERT INTO departments (name, name_ar, code) VALUES
    ('Operations',        'العمليات',             'OPS'),
    ('Human Resources',   'الموارد البشرية',       'HR'),
    ('Security',          'الأمن',                 'SEC'),
    ('Administration',    'الإدارة',               'ADM'),
    ('Intelligence',      'الاستخبارات',            'INT');
