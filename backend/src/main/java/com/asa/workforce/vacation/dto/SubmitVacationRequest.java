package com.asa.workforce.vacation.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SubmitVacationRequest {
    @NotNull private LocalDate startDate;
    @NotNull private LocalDate endDate;
    @Size(max = 1000) private String reason;
}
