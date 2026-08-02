package com.asa.workforce.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ResendOtpRequest {
    @NotBlank
    @Pattern(regexp = "\\d{10}", message = "National ID must be exactly 10 digits")
    private String nationalId;
}
