package com.asa.workforce.announcement.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record AnnouncementDto(
    UUID            id,
    String          title,
    String          body,
    boolean         pinned,
    UUID            authorId,
    String          authorNameAr,
    String          authorRole,
    OffsetDateTime  createdAt,
    long            replyCount,
    List<ReplyDto>  replies      // null on list endpoint; populated on /announcements/{id}
) {}
