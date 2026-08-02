package com.asa.workforce.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

/**
 * Standard API response envelope.
 *
 * All API responses use this structure to maintain consistency
 * and avoid accidentally leaking internal details.
 *
 * Success:  { "success": true,  "data": {...}, "timestamp": "..." }
 * Error:    { "success": false, "error": {...}, "timestamp": "..." }
 *
 * @param <T> the data type
 */
@Value
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    boolean success;

    T data;

    ErrorDetail error;

    @Builder.Default
    String timestamp = Instant.now().toString();

    String requestId;

    // --- Factory methods ---

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
            .success(true)
            .data(data)
            .build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
            .success(false)
            .error(ErrorDetail.builder().code(code).message(message).build())
            .build();
    }

    public static <T> ApiResponse<T> error(String code, String message, Object details) {
        return ApiResponse.<T>builder()
            .success(false)
            .error(ErrorDetail.builder().code(code).message(message).details(details).build())
            .build();
    }

    @Value
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetail {
        String code;
        String message;
        Object details; // validation errors, field errors — never stack traces
    }
}
