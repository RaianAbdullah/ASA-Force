package com.asa.workforce.schedule.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateSwapRequest {
    @NotNull
    private UUID      targetEmployeeId;
    @NotNull
    private LocalDate myWeekStart;
    @NotNull
    private LocalDate theirWeekStart;
    private String    reason;
}
