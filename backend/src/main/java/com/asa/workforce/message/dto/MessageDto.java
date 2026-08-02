package com.asa.workforce.message.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MessageDto(
    UUID            id,
    UUID            senderId,
    String          senderNameAr,
    String          senderRole,
    String          body,
    /** Relative URL path to serve the attachment, e.g. /v1/messages/attachments/{filename}. Null when no attachment. */
    String          attachmentUrl,
    /** "image" or "file". Null when no attachment. */
    String          attachmentType,
    /** Original filename. Null when no attachment. */
    String          attachmentName,
    OffsetDateTime  sentAt
) {}
