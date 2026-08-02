package com.asa.workforce.schedule.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class SwapRequestDto {
    private UUID      id;
    private String    requesterId;
    private String    requesterName;
    private String    targetId;
    private String    targetName;
    private LocalDate requesterWeekStart;
    private LocalDate targetWeekStart;
    private String    reason;
    private String    status;
    private String    reviewNotes;
    private String    createdAt;
}
