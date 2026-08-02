package com.asa.workforce.schedule.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Data @Builder
public class ScheduleDto {
    private UUID      id;
    private LocalDate weekStart;
    private String    workDays;        // e.g. "SUN,MON,TUE,WED,THU"
    private LocalTime shiftStart;
    private LocalTime shiftEnd;
    private boolean   isWeekendDuty;
    private String    notes;
    /** Today is a work day for this schedule */
    private boolean   todayIsWorkDay;
}
