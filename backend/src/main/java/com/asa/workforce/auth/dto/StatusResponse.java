package com.asa.workforce.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StatusResponse {
    private String nationalId;
    private String status;
    private String message;
}
