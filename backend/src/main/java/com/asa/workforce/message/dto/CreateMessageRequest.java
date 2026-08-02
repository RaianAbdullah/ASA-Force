package com.asa.workforce.message.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateMessageRequest(
    @Size(max = 2000) String body
) {}
