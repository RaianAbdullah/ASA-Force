package com.asa.workforce.common.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Health check endpoint.
 *
 * Available at: GET /api/healthz
 * (context-path is /api, controller path is /healthz)
 *
 * This endpoint is always public — it must NOT reveal sensitive
 * infrastructure details, database credentials, or internal hostnames.
 */
@RestController
@Tag(name = "Health", description = "Service health check")
public class HealthController {

    @GetMapping("/healthz")
    @Operation(
        summary = "Health check",
        description = "Returns service status. Always public. Does not reveal sensitive info."
    )
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("service", "ASA-Force API");
        response.put("timestamp", Instant.now().toString());
        response.put("stage", "1 — Project Foundation");
        return ResponseEntity.ok(response);
    }
}
