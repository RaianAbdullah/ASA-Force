package com.asa.workforce.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterPendingTokenRequest {

    @NotBlank(message = "National ID is required")
    @Pattern(regexp = "^\\d{10}$", message = "National ID must be exactly 10 digits")
    private String nationalId;

    @NotBlank(message = "Push token is required")
    @Size(max = 512, message = "Push token is too long")
    private String token;

    @Pattern(regexp = "^(ios|android|unknown)$", message = "Unsupported platform")
    private String platform;
}
