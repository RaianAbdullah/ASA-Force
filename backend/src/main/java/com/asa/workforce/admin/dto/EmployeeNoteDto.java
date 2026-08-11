package com.asa.workforce.admin.dto;

import lombok.Builder;
import lombok.Value;

import java.time.OffsetDateTime;
import java.util.UUID;

@Value
@Builder
public class EmployeeNoteDto {
    UUID id;
    UUID employeeId;
    String category;
    String note;
    UUID authorId;
    String authorNameAr;
    String authorRole;
    OffsetDateTime createdAt;
}

