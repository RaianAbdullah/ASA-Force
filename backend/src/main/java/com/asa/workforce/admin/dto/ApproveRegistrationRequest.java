package com.asa.workforce.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ApproveRegistrationRequest {

    @NotNull(message = "Department is required before approval")
    private UUID departmentId;
}
