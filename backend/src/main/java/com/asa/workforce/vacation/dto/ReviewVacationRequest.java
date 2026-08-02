package com.asa.workforce.vacation.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReviewVacationRequest {
    @Size(max = 500) private String notes;
}
