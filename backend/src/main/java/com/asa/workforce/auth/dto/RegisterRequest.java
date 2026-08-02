package com.asa.workforce.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "National ID is required")
    @Pattern(regexp = "^\\d{10}$", message = "National ID must be exactly 10 digits")
    private String nationalId;

    @NotBlank(message = "First name (Arabic) is required")
    @Size(min = 2, max = 100)
    private String firstNameAr;

    /** Optional middle name in Arabic */
    @Size(max = 100)
    private String middleNameAr;

    @NotBlank(message = "Last name (Arabic) is required")
    @Size(min = 2, max = 100)
    private String lastNameAr;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^\\+?[0-9]{9,15}$", message = "Invalid phone number format")
    private String phoneNumber;

    /** Optional — UUID of the department */
    private String departmentId;

    @NotBlank(message = "Password is required")
    @Size(min = 12, message = "Password must be at least 12 characters")
    private String password;
}
