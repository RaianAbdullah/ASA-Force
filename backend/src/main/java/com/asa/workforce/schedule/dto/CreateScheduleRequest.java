package com.asa.workforce.schedule.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data
public class CreateScheduleRequest {
    @NotNull private UUID      employeeId;
    @NotNull private LocalDate weekStart;    // must be a Monday
    @NotBlank private String   workDays;     // "SUN,MON,TUE,WED,THU"
    @NotNull private LocalTime shiftStart;
    @NotNull private LocalTime shiftEnd;
    private boolean            isWeekendDuty = false;
    private String             notes;
}
