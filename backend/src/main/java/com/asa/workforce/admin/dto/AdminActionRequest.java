package com.asa.workforce.admin.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminActionRequest {

    /** Required only for reject actions */
    @Size(max = 500, message = "Rejection reason must be at most 500 characters")
    private String reason;
}
