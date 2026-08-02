package com.asa.workforce.vacation.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder
public class VacationRequestDto {
    private UUID           id;
    private UUID           employeeId;
    private String         employeeNameAr;
    private String         departmentNameAr;
    private LocalDate      startDate;
    private LocalDate      endDate;
    private int            totalDays;
    private String         reason;
    private String         status;

    // Stage 1 — department manager review
    private String         deptReviewerNameAr;
    private OffsetDateTime deptReviewedAt;
    private String         deptReviewNotes;

    // Stage 2 — main manager / final review
    private String         reviewerNameAr;
    private OffsetDateTime reviewedAt;
    private String         reviewNotes;

    private OffsetDateTime createdAt;
}
