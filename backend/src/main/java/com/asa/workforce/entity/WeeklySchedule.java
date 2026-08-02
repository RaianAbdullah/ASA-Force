package com.asa.workforce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Table(name = "weekly_schedules",
       uniqueConstraints = @UniqueConstraint(columnNames = {"employee_id", "week_start"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class WeeklySchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    /** Comma-separated day abbreviations: MON,TUE,WED,THU,SUN */
    @Column(name = "work_days", nullable = false, length = 20)
    private String workDays;

    @Column(name = "shift_start", nullable = false)
    private LocalTime shiftStart;

    @Column(name = "shift_end", nullable = false)
    private LocalTime shiftEnd;

    @Column(name = "is_weekend_duty", nullable = false)
    @Builder.Default
    private Boolean isWeekendDuty = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Employee createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // ── Helpers ───────────────────────────────────────────────

    /** Returns the set of DayOfWeek values parsed from the workDays string */
    public Set<DayOfWeek> parsedWorkDays() {
        if (workDays == null || workDays.isBlank()) return Set.of();
        return Arrays.stream(workDays.split(","))
                .map(String::trim)
                .map(this::abbrevToDay)
                .collect(Collectors.toSet());
    }

    private DayOfWeek abbrevToDay(String abbrev) {
        return switch (abbrev.toUpperCase()) {
            case "MON" -> DayOfWeek.MONDAY;
            case "TUE" -> DayOfWeek.TUESDAY;
            case "WED" -> DayOfWeek.WEDNESDAY;
            case "THU" -> DayOfWeek.THURSDAY;
            case "FRI" -> DayOfWeek.FRIDAY;
            case "SAT" -> DayOfWeek.SATURDAY;
            case "SUN" -> DayOfWeek.SUNDAY;
            default    -> throw new IllegalArgumentException("Unknown day: " + abbrev);
        };
    }
}
