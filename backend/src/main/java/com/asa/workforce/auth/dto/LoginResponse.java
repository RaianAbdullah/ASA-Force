package com.asa.workforce.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class LoginResponse {
    private String       accessToken;
    private String       refreshToken;
    private String       tokenType;            // "Bearer"
    private long         accessExpiresInSeconds;
    private long         refreshExpiresInDays;
    private String       employeeId;
    /** Primary role — kept for backward-compat. */
    private String       role;
    /** Full set of assigned roles (multi-role support). */
    private List<String> roles;
    private String       nameAr;
    private String       departmentNameAr;
    private String       status;
    /** True when an admin created this account — employee must set a new password before using the app. */
    private boolean      mustChangePassword;
}
