package com.asa.workforce.announcement.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ReplyDto(
    UUID           id,
    UUID           authorId,
    String         authorNameAr,
    String         authorRole,
    String         body,
    OffsetDateTime createdAt
) {}
