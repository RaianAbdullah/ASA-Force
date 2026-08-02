package com.asa.workforce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "attendance",
       uniqueConstraints = @UniqueConstraint(columnNames = {"employee_id", "attendance_date"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    // ── Check-in ──────────────────────────────────────────────
    @Column(name = "check_in_time")
    private OffsetDateTime checkInTime;

    @Column(name = "check_in_latitude",  precision = 10, scale = 7)
    private BigDecimal checkInLatitude;

    @Column(name = "check_in_longitude", precision = 10, scale = 7)
    private BigDecimal checkInLongitude;

    // ── Check-out ─────────────────────────────────────────────
    @Column(name = "check_out_time")
    private OffsetDateTime checkOutTime;

    @Column(name = "check_out_latitude",  precision = 10, scale = 7)
    private BigDecimal checkOutLatitude;

    @Column(name = "check_out_longitude", precision = 10, scale = 7)
    private BigDecimal checkOutLongitude;

    // ── Status ────────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.ABSENT;

    @Column(name = "minutes_late", nullable = false)
    @Builder.Default
    private Short minutesLate = 0;

    /** True when a dev/admin bypassed the geofence check */
    @Column(name = "geofence_override", nullable = false)
    @Builder.Default
    private Boolean geofenceOverride = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // ── Enum ──────────────────────────────────────────────────
    public enum Status {
        PRESENT,   // checked in on time
        LATE,      // checked in after grace period
        ABSENT,    // no check-in recorded
        EXCUSED,   // admin-excused absence
        HOLIDAY    // official holiday
    }
}
