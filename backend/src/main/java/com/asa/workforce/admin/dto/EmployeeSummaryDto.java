package com.asa.workforce.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/** Lightweight employee record used for admin pickers and employee list screens. */
@Data
@Builder
public class EmployeeSummaryDto {
    private UUID         id;
    private String       nationalId;
    private String       firstNameAr;
    private String       middleNameAr;
    private String       lastNameAr;
    private UUID         departmentId;
    private String       departmentNameAr;
    /** Primary role — kept for backward-compat display. */
    private String       role;
    /** Full set of assigned roles (multi-role support). */
    private List<String> roles;
    private String       status;
    private String       maskedPhone;
    private int          vacationDaysPerYear;
}
