package com.asa.workforce.notification.controller;

import com.asa.workforce.audit.AuditService;
import com.asa.workforce.common.dto.ApiResponse;
import com.asa.workforce.entity.Employee;
import com.asa.workforce.entity.PushToken;
import com.asa.workforce.notification.dto.RegisterTokenRequest;
import com.asa.workforce.repository.EmployeeRepository;
import com.asa.workforce.repository.PushTokenRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Push notification token management")
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final EmployeeRepository   employeeRepository;
    private final PushTokenRepository  pushTokenRepository;
    private final AuditService         auditService;

    /**
     * POST /v1/notifications/push-token
     * Registers or updates a push token for the authenticated employee.
     * Idempotent — safe to call on every app launch.
     */
    @PostMapping("/push-token")
    @Operation(summary = "Register or refresh a push notification token")
    public ResponseEntity<ApiResponse<Map<String, String>>> registerToken(
            @Valid @RequestBody RegisterTokenRequest req,
            Authentication auth,
            HttpServletRequest httpReq) {

        Employee emp = employeeRepository.findByNationalId(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        String platform = req.getPlatform() != null ? req.getPlatform() : "unknown";

        // Upsert: update platform if token already exists, otherwise create
        Optional<PushToken> existing = pushTokenRepository.findByToken(req.getToken());
        if (existing.isPresent()) {
            PushToken pt = existing.get();
            pt.setPlatform(platform);
            pushTokenRepository.save(pt);
        } else {
            pushTokenRepository.save(PushToken.builder()
                    .employee(emp)
                    .token(req.getToken())
                    .platform(platform)
                    .build());
        }

        auditService.log(AuditService.PUSH_TOKEN_REG, emp,
                Map.of("platform", platform), httpReq);

        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", "registered")));
    }
}
