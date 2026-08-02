package com.asa.workforce.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VerifyOtpResponse {
    private String status;
    private String message;
}
