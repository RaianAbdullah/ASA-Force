package com.asa.workforce.admin.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class PendingEmployeeDto {
    private String         id;
    private String         nationalId;     // masked
    private String         firstNameAr;
    private String         middleNameAr;
    private String         lastNameAr;
    private String         maskedPhone;
    private String         status;
    private OffsetDateTime registeredAt;
    private OffsetDateTime otpVerifiedAt;  // = updatedAt when status flipped to PENDING_APPROVAL
}
