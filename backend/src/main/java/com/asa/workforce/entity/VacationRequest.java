package com.asa.workforce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "vacation_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VacationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private VacationStatus status = VacationStatus.PENDING_DEPT_MANAGER;

    // ── Department-manager review (stage 1) ──────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_reviewed_by")
    private Employee deptReviewedBy;

    @Column(name = "dept_reviewed_at")
    private OffsetDateTime deptReviewedAt;

    @Column(name = "dept_review_notes", columnDefinition = "TEXT")
    private String deptReviewNotes;

    // ── Main-manager / final review (stage 2) ────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private Employee reviewedBy;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum VacationStatus {
        /** Waiting for the employee's department manager to review */
        PENDING_DEPT_MANAGER,
        /** Department manager approved — waiting for main manager/admin */
        PENDING_MAIN_MANAGER,
        /** Final approval granted */
        APPROVED,
        /** Rejected at any stage */
        REJECTED,
        /** Cancelled by the employee */
        CANCELLED
    }
}
