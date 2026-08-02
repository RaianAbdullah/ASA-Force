package com.asa.workforce.vacation.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VacationBalanceDto {
    private int daysAllowed;
    private int daysUsed;
    private int daysRemaining;
    private int year;
}
