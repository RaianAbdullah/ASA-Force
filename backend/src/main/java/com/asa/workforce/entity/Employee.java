package com.asa.workforce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "national_id", nullable = false, unique = true, length = 10)
    private String nationalId;

    @Column(name = "first_name_ar", nullable = false, length = 100)
    private String firstNameAr;

    @Column(name = "middle_name_ar", length = 100)
    private String middleNameAr;

    @Column(name = "last_name_ar", nullable = false, length = 100)
    private String lastNameAr;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.EMPLOYEE;

    /** Full set of roles assigned to this employee (multi-role support). */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "employee_roles", joinColumns = @JoinColumn(name = "employee_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 30)
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private Status status = Status.PENDING_VERIFICATION;

    // OTP — stored in DB for Stage 3; moved to Redis in Stage 5
    @Column(name = "otp_code", length = 6)
    private String otpCode;

    @Column(name = "otp_expires_at")
    private OffsetDateTime otpExpiresAt;

    @Column(name = "otp_attempts", nullable = false)
    @Builder.Default
    private Short otpAttempts = 0;

    // Login brute-force protection (V4)
    @Column(name = "login_attempts", nullable = false)
    @Builder.Default
    private Short loginAttempts = 0;

    @Column(name = "login_locked_until")
    private OffsetDateTime loginLockedUntil;

    // Admin review (V4)
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "reviewed_by")
    private java.util.UUID reviewedBy;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Column(name = "password_changed_at")
    private OffsetDateTime passwordChangedAt;

    @Column(name = "must_change_password", nullable = false)
    @Builder.Default
    private boolean mustChangePassword = false;

    @Column(name = "vacation_days_per_year", nullable = false)
    @Builder.Default
    private int vacationDaysPerYear = 21;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // ── Enums ────────────────────────────────────────────────

    public enum Role {
        /** Full platform access — manages departments, accounts, and security settings */
        SYSTEM_ADMIN,
        /** Manages all employees across departments; approves leave; monitors activity */
        MAIN_MANAGER,
        /** Views and manages employees within their own department only */
        DEPARTMENT_MANAGER,
        /** Standard workforce member — checks in, views schedule, submits leave */
        EMPLOYEE,
        /** Receives approved leave notifications and handles required follow-up */
        RESPONSIBLE_OFFICER,
        /** Assigns any employee to weekend shifts; views all vacation requests; notified on approval */
        WEEKEND_MANAGER
    }

    public enum Status {
        PENDING_VERIFICATION,   // registered, OTP not yet verified
        PENDING_APPROVAL,       // OTP verified, awaiting admin activation
        ACTIVE,                 // fully active
        SUSPENDED,              // temporarily disabled
        REJECTED                // registration rejected by admin
    }
}
