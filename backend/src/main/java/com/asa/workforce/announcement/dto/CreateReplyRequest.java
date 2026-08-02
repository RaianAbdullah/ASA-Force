package com.asa.workforce.announcement.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateReplyRequest(
    @NotBlank String body
) {}
