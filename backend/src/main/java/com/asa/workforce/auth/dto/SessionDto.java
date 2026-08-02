package com.asa.workforce.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class SessionDto {
    private String         id;
    private String         deviceInfo;
    private OffsetDateTime issuedAt;
    private OffsetDateTime expiresAt;
    private OffsetDateTime lastUsedAt;
}
