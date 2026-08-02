package com.asa.workforce.department.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateDepartmentRequest {
    @Size(max = 150) private String nameEn;
    @Size(max = 150) private String nameAr;
    private String  managerId;   // UUID string, nullable — use "" to unset
    private Boolean isActive;
    private Boolean isCrossDepartment;
}
