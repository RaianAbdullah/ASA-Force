package com.asa.workforce.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateEmployeeResponse {
    private String employeeId;
    private String nationalId;
    private String firstNameAr;
    private String middleNameAr;
    private String lastNameAr;
    private String role;
    private String departmentNameAr;
    /** Temporary password shown to admin ONCE — equals the national ID.
     *  Employee must change it on first login. */
    private String tempPassword;
    private String message;
}
