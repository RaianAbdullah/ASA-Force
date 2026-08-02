package com.asa.workforce.admin.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class UpdateEmployeeRequest {
    private String       firstNameAr;
    private String       middleNameAr;
    private String       lastNameAr;
    private String       phoneNumber;
    /** Single role — used when multi-role list is not provided (backward compat). */
    private String       role;
    /** Full set of roles to assign — takes precedence over 'role' when present. */
    private List<String> roles;
    private String       status;
    private UUID         departmentId;
    private Integer      vacationDaysPerYear;
}
