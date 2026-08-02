# Database Design

**Status: Stage 1 — Design only. Schema implemented in Stage 2.**

---

## Technology

- **PostgreSQL 16** hosted on Render in production and Docker locally
- **Flyway** for versioned migrations
- **Spring Data JPA / Hibernate** for ORM

## Design Principles

- Integer PKs internally; UUID (`publicId`) exposed via API
- All timestamps in UTC (`TIMESTAMP WITH TIME ZONE`)
- Soft deletes for historical data (never `DELETE` attendance)
- Foreign key constraints enforced at DB level
- Unique constraints for business rules (employee_number, email, attendance uniqueness)
- `created_at` and `updated_at` on all tables

## Planned Entities

### users
```sql
id                BIGSERIAL PRIMARY KEY
public_id         UUID UNIQUE NOT NULL DEFAULT gen_random_uuid()
employee_number   VARCHAR(50) UNIQUE NOT NULL
email             VARCHAR(255) UNIQUE NOT NULL
phone_number      VARCHAR(20) NOT NULL
password_hash     VARCHAR(255) NOT NULL
first_name        VARCHAR(100) NOT NULL
last_name         VARCHAR(100) NOT NULL
role              VARCHAR(50) NOT NULL  -- EMPLOYEE, MANAGER, DEPT_MANAGER, ADMIN, SUPER_ADMIN
status            VARCHAR(50) NOT NULL  -- PENDING_OTP, PENDING_ADMIN_APPROVAL, ACTIVE, ...
department_id     BIGINT REFERENCES departments(id)
manager_id        BIGINT REFERENCES users(id)
failed_login_attempts INT DEFAULT 0
locked_until      TIMESTAMP WITH TIME ZONE
last_login_at     TIMESTAMP WITH TIME ZONE
password_changed_at TIMESTAMP WITH TIME ZONE
approved_at       TIMESTAMP WITH TIME ZONE
approved_by       BIGINT REFERENCES users(id)
created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### departments
```sql
id            BIGSERIAL PRIMARY KEY
public_id     UUID UNIQUE NOT NULL DEFAULT gen_random_uuid()
name_arabic   VARCHAR(200) NOT NULL
name_english  VARCHAR(200) NOT NULL
description   TEXT
manager_id    BIGINT REFERENCES users(id)
active        BOOLEAN DEFAULT TRUE
created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### schedules
```sql
id            BIGSERIAL PRIMARY KEY
public_id     UUID UNIQUE NOT NULL DEFAULT gen_random_uuid()
employee_id   BIGINT REFERENCES users(id)
department_id BIGINT REFERENCES departments(id)
schedule_date DATE NOT NULL
shift_start   TIME NOT NULL
shift_end     TIME NOT NULL
schedule_type VARCHAR(50) NOT NULL  -- REGULAR, WEEKEND_DUTY, HOLIDAY
version       INT DEFAULT 1
published     BOOLEAN DEFAULT FALSE
published_at  TIMESTAMP WITH TIME ZONE
created_by    BIGINT REFERENCES users(id)
created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### attendance_records
```sql
id               BIGSERIAL PRIMARY KEY
public_id        UUID UNIQUE NOT NULL DEFAULT gen_random_uuid()
employee_id      BIGINT NOT NULL REFERENCES users(id)
department_id    BIGINT REFERENCES departments(id)
schedule_id      BIGINT REFERENCES schedules(id)
attendance_date  DATE NOT NULL
check_in_at      TIMESTAMP WITH TIME ZONE NOT NULL  -- server-generated
classification   VARCHAR(50) NOT NULL  -- ON_TIME, LATE, MISSING, etc.
verification_method VARCHAR(50)  -- MANUAL, QR, LOCATION
qr_verified      BOOLEAN DEFAULT FALSE
location_verified BOOLEAN DEFAULT FALSE
session_id       BIGINT REFERENCES refresh_token_sessions(id)
corrected_at     TIMESTAMP WITH TIME ZONE
corrected_by     BIGINT REFERENCES users(id)
correction_reason TEXT
created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()

UNIQUE (employee_id, attendance_date)  -- Prevents duplicate check-in
```

### vacation_requests, otp_verifications, refresh_token_sessions, notifications, audit_logs
(Detailed in Stage 2 Flyway migrations)

## Account Status Lifecycle

```
PENDING_OTP → PENDING_ADMIN_APPROVAL → ACTIVE
                                      ↓         ↓
                                   SUSPENDED  DEACTIVATED
                                      ↑
                                   LOCKED
                              PASSWORD_RESET_REQUIRED
                              REJECTED
```
