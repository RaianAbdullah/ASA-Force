package com.asa.workforce.auth.dto;

import lombok.Data;

@Data
public class LogoutRequest {
    /** Optional — if provided, the refresh token session is also revoked. */
    private String refreshToken;
}
