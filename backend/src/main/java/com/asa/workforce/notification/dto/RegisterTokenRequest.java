package com.asa.workforce.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RegisterTokenRequest {

    @NotBlank(message = "Token is required")
    private String token;

    @Pattern(regexp = "^(ios|android|unknown)$", message = "Platform must be ios, android, or unknown")
    private String platform;
}
