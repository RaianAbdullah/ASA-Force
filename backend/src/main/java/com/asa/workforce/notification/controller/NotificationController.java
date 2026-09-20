package com.asa.workforce.notification.controller;

import com.asa.workforce.audit.AuditService;
import com.asa.workforce.common.dto.ApiResponse;
import com.asa.workforce.entity.Employee;
import com.asa.workforce.entity.PushToken;
import com.asa.workforce.notification.dto.RegisterTokenRequest;
import com.asa.workforce.notification.dto.RegisterPendingTokenRequest;
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
        upsertToken(emp, req.getToken(), platform);

        auditService.log(AuditService.PUSH_TOKEN_REG, emp,
                Map.of("platform", platform), httpReq);

        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", "registered")));
    }

    /** Registers a token while an OTP-verified employee waits for approval. */
    @PostMapping("/push-token/pending")
    @Operation(summary = "Register a push token for an employee awaiting approval")
    public ResponseEntity<ApiResponse<Map<String, String>>> registerPendingToken(
            @Valid @RequestBody RegisterPendingTokenRequest req,
            HttpServletRequest httpReq) {

        Employee emp = employeeRepository.findByNationalId(req.getNationalId())
                .orElseThrow(() -> new IllegalArgumentException("Registration is not awaiting approval"));

        if (emp.getStatus() != Employee.Status.PENDING_APPROVAL) {
            throw new IllegalStateException("Registration is not awaiting approval");
        }

        String platform = req.getPlatform() != null ? req.getPlatform() : "unknown";
        upsertToken(emp, req.getToken(), platform);
        auditService.log(AuditService.PUSH_TOKEN_REG, emp,
                Map.of("platform", platform, "pending", true), httpReq);

        return ResponseEntity.ok(ApiResponse.ok(Map.of("status", "registered")));
    }

    private void upsertToken(Employee employee, String token, String platform) {
        PushToken pushToken = pushTokenRepository.findByToken(token)
                .orElseGet(() -> PushToken.builder().token(token).build());
        // A device token can legitimately move to another account after logout.
        pushToken.setEmployee(employee);
        pushToken.setPlatform(platform);
        pushTokenRepository.save(pushToken);
    }
}
