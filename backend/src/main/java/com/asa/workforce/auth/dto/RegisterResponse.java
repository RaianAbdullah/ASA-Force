package com.asa.workforce.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterResponse {
    private String employeeId;
    private String nationalId;
    private String status;
    private String message;
    private String maskedPhone;
    /** OTP printed to console in dev; sent via SMS in production */
    private String otpHint;
}
