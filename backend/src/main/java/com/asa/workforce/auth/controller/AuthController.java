package com.asa.workforce.auth.controller;

import com.asa.workforce.auth.dto.*;
import com.asa.workforce.auth.service.AuthService;
import com.asa.workforce.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Registration, OTP, login, token refresh, logout")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new employee account")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpReq) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(authService.register(request, httpReq)));
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend OTP to a PENDING_VERIFICATION account")
    public ResponseEntity<ApiResponse<Map<String, String>>> resendOtp(
            @Valid @RequestBody ResendOtpRequest request,
            HttpServletRequest httpReq) {

        authService.resendOtp(request, httpReq);
        return ResponseEntity.ok(ApiResponse.ok(
                Map.of("message", "A new OTP has been sent to your registered phone number.")));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify the OTP sent after registration")
    public ResponseEntity<ApiResponse<VerifyOtpResponse>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request,
            HttpServletRequest httpReq) {

        return ResponseEntity.ok(ApiResponse.ok(authService.verifyOtp(request, httpReq)));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate — returns short-lived access token + rotating refresh token")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpReq) {

        return ResponseEntity.ok(ApiResponse.ok(authService.login(request, httpReq)));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate a refresh token and receive a new access token + refresh token")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(
            @Valid @RequestBody RefreshRequest request,
            HttpServletRequest httpReq) {

        return ResponseEntity.ok(ApiResponse.ok(authService.refresh(request, httpReq)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke the current access token and (optionally) the refresh token")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody(required = false) LogoutRequest body,
            HttpServletRequest httpReq) {

        authService.logout(authHeader, body, httpReq);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/status/{nationalId}")
    @Operation(summary = "Check the registration status of an employee (rate-limited)")
    public ResponseEntity<ApiResponse<StatusResponse>> getStatus(
            @PathVariable String nationalId) {

        return ResponseEntity.ok(ApiResponse.ok(authService.getStatus(nationalId)));
    }

    // ── Password reset ────────────────────────────────────────────────────────

    @PostMapping("/forgot-password")
    @Operation(summary = "Initiate a password reset (always 200 — no enumeration)")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpReq) {

        authService.forgotPassword(request, httpReq);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Complete a password reset using the reset token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpReq) {

        authService.resetPassword(request, httpReq);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ── Authenticated password / session operations ───────────────────────────

    @PostMapping("/change-password")
    @Operation(summary = "Change password (authenticated — also revokes all refresh sessions)")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpReq) {

        authService.changePassword(user.getUsername(), request, httpReq);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/sessions")
    @Operation(summary = "List active refresh token sessions for the current employee")
    public ResponseEntity<ApiResponse<List<SessionDto>>> getSessions(
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ApiResponse.ok(authService.getSessions(user.getUsername())));
    }

    @DeleteMapping("/sessions/{sessionId}")
    @Operation(summary = "Revoke a specific refresh session")
    public ResponseEntity<ApiResponse<Void>> revokeSession(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID sessionId,
            HttpServletRequest httpReq) {

        authService.revokeSession(user.getUsername(), sessionId, httpReq);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PostMapping("/logout-all")
    @Operation(summary = "Revoke the current access token and ALL refresh sessions")
    public ResponseEntity<ApiResponse<Void>> logoutAll(
            @RequestHeader("Authorization") String authHeader,
            HttpServletRequest httpReq) {

        authService.logoutAll(authHeader, httpReq);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
