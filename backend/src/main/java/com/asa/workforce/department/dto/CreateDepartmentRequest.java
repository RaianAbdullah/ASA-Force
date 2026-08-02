package com.asa.workforce.department.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateDepartmentRequest {
    @NotBlank @Size(max = 150) private String nameEn;
    @NotBlank @Size(max = 150) private String nameAr;
    @NotBlank @Size(max = 20)  private String code;
    private boolean isCrossDepartment = false;
    private String  managerId;   // UUID string, nullable
}
