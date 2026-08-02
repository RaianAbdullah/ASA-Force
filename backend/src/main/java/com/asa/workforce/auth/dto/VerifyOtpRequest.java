package com.asa.workforce.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerifyOtpRequest {

    @NotBlank(message = "National ID is required")
    @Pattern(regexp = "^\\d{10}$", message = "National ID must be exactly 10 digits")
    private String nationalId;

    @NotBlank(message = "OTP code is required")
    @Pattern(regexp = "^\\d{6}$", message = "OTP must be 6 digits")
    private String otpCode;
}
