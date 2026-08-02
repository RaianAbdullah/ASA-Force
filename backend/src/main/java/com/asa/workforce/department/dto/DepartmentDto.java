package com.asa.workforce.department.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder
public class DepartmentDto {
    private UUID            id;
    private String          nameEn;
    private String          nameAr;
    private String          code;
    private boolean         isActive;
    private boolean         isCrossDepartment;
    private String          managerName;
    private UUID            managerId;
    private int             employeeCount;
    private OffsetDateTime  createdAt;
}
