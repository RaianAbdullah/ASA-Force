package com.asa.workforce.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateEmployeeRequest {

    @NotBlank
    @Pattern(regexp = "\\d{10}", message = "National ID must be exactly 10 digits")
    private String nationalId;

    @NotBlank @Size(max = 100)
    private String firstNameAr;

    /** Optional middle name in Arabic */
    @Size(max = 100)
    private String middleNameAr;

    @NotBlank @Size(max = 100)
    private String lastNameAr;

    @NotBlank @Pattern(regexp = "05\\d{8}", message = "Phone must be a valid Saudi mobile number")
    private String phoneNumber;

    /** UUID of the department — optional */
    private String departmentId;

    /** EMPLOYEE | DEPARTMENT_MANAGER | MAIN_MANAGER | SYSTEM_ADMIN */
    @NotBlank
    private String role;
}
