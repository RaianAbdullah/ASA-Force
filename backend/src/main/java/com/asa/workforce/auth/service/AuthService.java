package com.asa.workforce.auth.service;

import com.asa.workforce.audit.AuditService;
import com.asa.workforce.auth.dto.*;
import com.asa.workforce.entity.Department;
import com.asa.workforce.entity.Employee;
import com.asa.workforce.entity.Employee.Status;
import com.asa.workforce.entity.PasswordResetToken;
import com.asa.workforce.entity.RefreshTokenSession;
import com.asa.workforce.notification.PushNotificationService;
import com.asa.workforce.repository.DepartmentRepository;
import com.asa.workforce.repository.EmployeeRepository;
import com.asa.workforce.repository.PasswordResetRepository;
import com.asa.workforce.repository.PushTokenRepository;
import com.asa.workforce.repository.RefreshTokenRepository;
import com.asa.workforce.security.JwtService;
import com.asa.workforce.security.RefreshTokenService;
import com.asa.workforce.security.TokenBlacklistService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_OTP_ATTEMPTS   = 3;
    private static final int MAX_LOGIN_ATTEMPTS = 5;
    private static final int LOGIN_LOCK_MINUTES = 30;

    private static final int RESET_TOKEN_EXPIRY_MINUTES = 15;

    private final EmployeeRepository      employeeRepository;
    private final DepartmentRepository    departmentRepository;
    private final PushTokenRepository     pushTokenRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final RefreshTokenRepository  refreshTokenRepository;
    private final BCryptPasswordEncoder   passwordEncoder;
    private final JwtService              jwtService;
    private final RefreshTokenService     refreshTokenService;
    private final TokenBlacklistService   blacklistService;
    private final AuditService            auditService;
    private final PushNotificationService pushService;
    private final SecureRandom            secureRandom = new SecureRandom();

    @Value("${app.otp.log-to-console:false}")
    private boolean otpLogToConsole;

    @Value("${jwt.refresh-expiry-days:3}")
    private int refreshExpiryDays;

    // ── Register ─────────────────────────────────────────────────────────────

    @Transactional
    public RegisterResponse register(RegisterRequest req, HttpServletRequest httpReq) {
        if (employeeRepository.existsByNationalId(req.getNationalId())) {
            auditService.log(AuditService.REGISTER, null,
                    Map.of("nationalId", mask(req.getNationalId()), "reason", "duplicate_national_id"),
                    httpReq);
            throw new IllegalArgumentException("National ID already registered");
        }
        if (employeeRepository.existsByPhoneNumber(req.getPhoneNumber())) {
            throw new IllegalArgumentException("Phone number already registered");
        }

        Department dept = null;
        if (req.getDepartmentId() != null && !req.getDepartmentId().isBlank()) {
            dept = departmentRepository.findById(UUID.fromString(req.getDepartmentId())).orElse(null);
        }

        String otp    = generateOtp();
        OffsetDateTime xAt = OffsetDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

        Employee emp = Employee.builder()
                .nationalId(req.getNationalId())
                .firstNameAr(req.getFirstNameAr())
                .middleNameAr(req.getMiddleNameAr())
                .lastNameAr(req.getLastNameAr())
                .phoneNumber(req.getPhoneNumber())
                .department(dept)
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .status(Status.PENDING_VERIFICATION)
                .otpCode(otp)
                .otpExpiresAt(xAt)
                .build();

        emp = employeeRepository.save(emp);

        if (otpLogToConsole) {
            log.info("[DEV OTP] National ID={} OTP={} (expires {})", req.getNationalId(), otp, xAt);
        }

        auditService.log(AuditService.REGISTER, emp,
                Map.of("maskedId", mask(req.getNationalId())), httpReq);

        List<String> adminTokens = pushTokenRepository.findAdminPushTokens();
        pushService.sendToTokens(adminTokens,
                "طلب تسجيل جديد — New Registration",
                emp.getFirstNameAr() + " " + emp.getLastNameAr() + " is awaiting OTP verification",
                Map.of("type", "new_registration", "employeeId", emp.getId().toString()));

        return RegisterResponse.builder()
                .employeeId(emp.getId().toString())
                .nationalId(mask(req.getNationalId()))
                .status(emp.getStatus().name())
                .message("Registration submitted. Please verify with the OTP sent to your phone.")
                .maskedPhone(maskPhone(req.getPhoneNumber()))
                .otpHint(otpLogToConsole ? "[DEV] OTP logged to server console" : null)
                .build();
    }

    // ── Resend OTP ───────────────────────────────────────────────────────────

    @Transactional
    public void resendOtp(ResendOtpRequest req, HttpServletRequest httpReq) {
        // Silently succeed for unknown national IDs or accounts that are not in
        // PENDING_VERIFICATION state.  Returning the same generic response
        // regardless of outcome prevents callers from enumerating account
        // existence or inferring account lifecycle status.
        Optional<Employee> empOpt = employeeRepository.findByNationalId(req.getNationalId());
        if (empOpt.isEmpty() || empOpt.get().getStatus() != Status.PENDING_VERIFICATION) {
            log.debug("[AUTH] resend-otp: no eligible account for nationalId={}",
                    mask(req.getNationalId()));
            return;
        }

        Employee emp = empOpt.get();
        String otp   = generateOtp();
        OffsetDateTime expiresAt = OffsetDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

        emp.setOtpCode(otp);
        emp.setOtpExpiresAt(expiresAt);
        emp.setOtpAttempts((short) 0);
        employeeRepository.save(emp);

        if (otpLogToConsole) {
            log.info("[DEV OTP RESEND] National ID={} OTP={} (expires {})",
                    mask(req.getNationalId()), otp, expiresAt);
        }

        auditService.log(AuditService.REGISTER, emp,
                Map.of("action", "otp_resend", "maskedId", mask(req.getNationalId())), httpReq);
        log.info("[AUTH] OTP resent for nationalId={}", mask(req.getNationalId()));
    }

    // ── Verify OTP ───────────────────────────────────────────────────────────

    @Transactional
    public VerifyOtpResponse verifyOtp(VerifyOtpRequest req, HttpServletRequest httpReq) {
        Employee emp = employeeRepository.findByNationalId(req.getNationalId())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        if (emp.getStatus() != Status.PENDING_VERIFICATION) {
            throw new IllegalStateException("Account is not awaiting OTP verification");
        }
        if (emp.getOtpAttempts() >= MAX_OTP_ATTEMPTS) {
            auditService.log(AuditService.OTP_LOCKED, emp,
                    Map.of("attempts", emp.getOtpAttempts()), httpReq);
            throw new IllegalStateException(
                    "Account locked after " + MAX_OTP_ATTEMPTS +
                    " failed OTP attempts. Please contact HR.");
        }
        if (emp.getOtpExpiresAt() == null || OffsetDateTime.now().isAfter(emp.getOtpExpiresAt())) {
            throw new IllegalStateException("OTP has expired. Please request a new one.");
        }
        if (!req.getOtpCode().equals(emp.getOtpCode())) {
            emp.setOtpAttempts((short) (emp.getOtpAttempts() + 1));
            employeeRepository.save(emp);
            auditService.log(AuditService.OTP_VERIFY_FAILURE, emp,
                    Map.of("attempts", emp.getOtpAttempts(),
                           "remaining", MAX_OTP_ATTEMPTS - emp.getOtpAttempts()),
                    httpReq);
            int remaining = MAX_OTP_ATTEMPTS - emp.getOtpAttempts();
            throw new IllegalArgumentException(
                    "Invalid OTP code. " + remaining + " attempt(s) remaining.");
        }

        emp.setOtpCode(null);
        emp.setOtpExpiresAt(null);
        emp.setOtpAttempts((short) 0);
        emp.setStatus(Status.PENDING_APPROVAL);
        employeeRepository.save(emp);

        auditService.log(AuditService.OTP_VERIFY_SUCCESS, emp,
                Map.of("status", "PENDING_APPROVAL"), httpReq);
        log.info("[AUTH] Employee {} OTP verified → PENDING_APPROVAL", mask(req.getNationalId()));

        List<String> adminTokens = pushTokenRepository.findAdminPushTokens();
        pushService.sendToTokens(adminTokens,
                "موظف ينتظر الموافقة — Awaiting Approval",
                emp.getFirstNameAr() + " " + emp.getLastNameAr() + " has verified their OTP",
                Map.of("type", "pending_approval", "employeeId", emp.getId().toString()));

        return VerifyOtpResponse.builder()
                .status(Status.PENDING_APPROVAL.name())
                .message("OTP verified. Your account is pending admin approval.")
                .build();
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    @Transactional
    public LoginResponse login(LoginRequest req, HttpServletRequest httpReq) {
        Employee emp = employeeRepository.findByNationalId(req.getNationalId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (emp.getLoginLockedUntil() != null &&
                OffsetDateTime.now().isBefore(emp.getLoginLockedUntil())) {
            auditService.log(AuditService.LOGIN_LOCKED, emp,
                    Map.of("lockedUntil", emp.getLoginLockedUntil().toString()), httpReq);
            throw new IllegalStateException(
                    "Account temporarily locked due to too many failed login attempts. " +
                    "Try again in " + LOGIN_LOCK_MINUTES + " minutes.");
        }

        if (!passwordEncoder.matches(req.getPassword(), emp.getPasswordHash())) {
            short attempts = (short) (emp.getLoginAttempts() + 1);
            emp.setLoginAttempts(attempts);
            if (attempts >= MAX_LOGIN_ATTEMPTS) {
                emp.setLoginLockedUntil(OffsetDateTime.now().plusMinutes(LOGIN_LOCK_MINUTES));
                emp.setLoginAttempts((short) 0);
                log.warn("[SECURITY] Account {} locked after {} failed login attempts",
                        mask(req.getNationalId()), MAX_LOGIN_ATTEMPTS);
            }
            employeeRepository.save(emp);
            auditService.log(AuditService.LOGIN_FAILURE, emp,
                    Map.of("attempts", attempts), httpReq);
            throw new IllegalArgumentException("Invalid credentials");
        }

        switch (emp.getStatus()) {
            case PENDING_VERIFICATION ->
                throw new IllegalStateException("Please verify your OTP first.");
            case PENDING_APPROVAL ->
                throw new IllegalStateException("Your account is pending admin approval.");
            case SUSPENDED ->
                throw new IllegalStateException("Your account has been suspended. Contact HR.");
            case REJECTED ->
                throw new IllegalStateException("Your registration was rejected. Contact HR.");
            default -> { /* ACTIVE — fall through */ }
        }

        emp.setLoginAttempts((short) 0);
        emp.setLoginLockedUntil(null);
        employeeRepository.save(emp);

        String accessToken  = jwtService.generateToken(emp);
        String deviceInfo   = truncate(httpReq.getHeader("User-Agent"), 200);
        String refreshToken = refreshTokenService.createForEmployee(emp, deviceInfo);

        auditService.log(AuditService.LOGIN_SUCCESS, emp,
                Map.of("role", emp.getRole().name()), httpReq);
        log.info("[AUTH] Login success: {} role={}", mask(req.getNationalId()), emp.getRole());

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .accessExpiresInSeconds((long) jwtService.getAccessExpiryMinutes() * 60)
                .refreshExpiresInDays(refreshExpiryDays)
                .employeeId(emp.getId().toString())
                .role(emp.getRole().name())
                .roles(emp.getRoles().stream().map(Employee.Role::name).toList())
                .nameAr(fullNameAr(emp))
                .departmentNameAr(emp.getDepartment() != null
                        ? emp.getDepartment().getNameAr()
                        : null)
                .status(emp.getStatus().name())
                .mustChangePassword(emp.isMustChangePassword())
                .build();
    }

    // ── Token Refresh ─────────────────────────────────────────────────────────

    @Transactional
    public LoginResponse refresh(RefreshRequest req, HttpServletRequest httpReq) {
        RefreshTokenService.RotationResult result;
        try {
            result = refreshTokenService.rotate(req.getRefreshToken());
        } catch (SecurityException ex) {
            // Reuse detected or invalid — audit and propagate
            auditService.log(AuditService.REFRESH_REUSE_DETECTED, null,
                    Map.of("reason", ex.getMessage()), httpReq);
            throw new IllegalStateException(ex.getMessage());
        }

        Employee emp = result.employee();

        // Verify account is still ACTIVE
        if (emp.getStatus() != Status.ACTIVE) {
            // Immediately revoke the new token just created during rotation
            refreshTokenService.revokeAllForEmployee(emp.getId());
            throw new IllegalStateException("Account is no longer active");
        }

        String newAccessToken = jwtService.generateToken(emp);

        auditService.log(AuditService.REFRESH_SUCCESS, emp,
                Map.of("role", emp.getRole().name()), httpReq);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(result.newRawToken())
                .tokenType("Bearer")
                .accessExpiresInSeconds((long) jwtService.getAccessExpiryMinutes() * 60)
                .refreshExpiresInDays(refreshExpiryDays)
                .employeeId(emp.getId().toString())
                .role(emp.getRole().name())
                .roles(emp.getRoles().stream().map(Employee.Role::name).toList())
                .nameAr(fullNameAr(emp))
                .departmentNameAr(emp.getDepartment() != null
                        ? emp.getDepartment().getNameAr()
                        : null)
                .status(emp.getStatus().name())
                .build();
    }

    // ── Logout ────────────────────────────────────────────────────────────────

    @Transactional
    public void logout(String bearerHeader, LogoutRequest body, HttpServletRequest httpReq) {
        // 1. Blacklist the access token jti
        if (bearerHeader != null && bearerHeader.startsWith("Bearer ")) {
            String token    = bearerHeader.substring(7);
            String jti      = jwtService.extractJti(token);
            Instant expiry  = jwtService.extractExpiry(token);
            String natId    = jwtService.extractSubjectUnchecked(token);

            Employee emp = null;
            try { emp = employeeRepository.findByNationalId(natId).orElse(null); }
            catch (Exception ignored) {}

            if (jti != null) {
                blacklistService.revoke(
                        jti, emp,
                        expiry != null
                            ? OffsetDateTime.ofInstant(expiry, ZoneOffset.UTC)
                            : OffsetDateTime.now().plusMinutes(jwtService.getAccessExpiryMinutes()),
                        "LOGOUT");
            }

            // 2. Revoke refresh token if client sent it
            if (body != null && body.getRefreshToken() != null
                    && !body.getRefreshToken().isBlank()) {
                refreshTokenService.revokeToken(body.getRefreshToken());
            }

            auditService.log(AuditService.LOGOUT, emp,
                    Map.of("maskedId", mask(natId)), httpReq);
            log.info("[AUTH] Logout: {}", mask(natId));
        }
    }

    // ── Status check ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StatusResponse getStatus(String nationalId) {
        Employee emp = employeeRepository.findByNationalId(nationalId).orElse(null);

        if (emp == null) {
            return StatusResponse.builder()
                    .nationalId(mask(nationalId))
                    .status("UNKNOWN")
                    .message("No account found for this ID.")
                    .build();
        }

        String message = switch (emp.getStatus()) {
            case PENDING_VERIFICATION -> "OTP verification pending.";
            case PENDING_APPROVAL     -> "Account awaiting admin approval.";
            case ACTIVE               -> "Account is active.";
            case SUSPENDED            -> "Account is suspended. Contact HR.";
            case REJECTED             -> "Registration was rejected. Contact HR.";
        };

        return StatusResponse.builder()
                .nationalId(mask(nationalId))
                .status(emp.getStatus().name())
                .message(message)
                .build();
    }

    // ── Forgot / Reset Password ───────────────────────────────────────────────

    /**
     * Initiates a password reset. Always returns HTTP 200 (no enumeration).
     * In dev mode (app.otp.log-to-console=true), the raw token is printed to the log.
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest req, HttpServletRequest httpReq) {
        Employee emp = employeeRepository.findByNationalId(req.getNationalId()).orElse(null);

        auditService.log(AuditService.FORGOT_PASSWORD, emp,
                Map.of("maskedId", mask(req.getNationalId())), httpReq);

        if (emp == null || emp.getStatus() != Status.ACTIVE) {
            // Silent — don't reveal whether the account exists
            return;
        }

        // Invalidate any outstanding tokens for this employee
        passwordResetRepository.invalidatePreviousTokens(emp.getId(), OffsetDateTime.now());

        // Generate a cryptographically random 32-byte token (64-char hex)
        byte[] raw = new byte[32];
        secureRandom.nextBytes(raw);
        String rawHex  = HexFormat.of().formatHex(raw);
        String hash    = sha256Hex(rawHex);

        PasswordResetToken prt = PasswordResetToken.builder()
                .employee(emp)
                .tokenHash(hash)
                .expiresAt(OffsetDateTime.now().plusMinutes(RESET_TOKEN_EXPIRY_MINUTES))
                .build();
        passwordResetRepository.save(prt);

        if (otpLogToConsole) {
            log.info("[DEV RESET] nationalId={} resetToken={} (expires {}min)",
                    mask(req.getNationalId()), rawHex, RESET_TOKEN_EXPIRY_MINUTES);
        } else {
            log.info("[AUTH] Password reset requested for nationalId={}", mask(req.getNationalId()));
            // TODO: integrate SMS/email delivery here
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req, HttpServletRequest httpReq) {
        String hash = sha256Hex(req.getResetToken());
        PasswordResetToken prt = passwordResetRepository.findByTokenHash(hash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (!prt.isValid()) {
            throw new IllegalArgumentException("Invalid or expired reset token");
        }

        Employee emp = prt.getEmployee();

        if (emp.getStatus() != Status.ACTIVE) {
            throw new IllegalStateException("Account is not active");
        }

        // Mark token as used
        prt.setUsedAt(OffsetDateTime.now());
        passwordResetRepository.save(prt);

        // Reset password and record timestamp
        emp.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        emp.setPasswordChangedAt(OffsetDateTime.now());
        emp.setLoginAttempts((short) 0);
        emp.setLoginLockedUntil(null);
        employeeRepository.save(emp);

        // Revoke all refresh sessions — forces re-login on all devices
        int revoked = refreshTokenService.revokeAllForEmployee(emp.getId());

        auditService.log(AuditService.PASSWORD_RESET, emp,
                Map.of("sessionsRevoked", revoked), httpReq);
        log.info("[AUTH] Password reset complete for nationalId={} — {} sessions revoked",
                mask(emp.getNationalId()), revoked);
    }

    // ── Change Password ───────────────────────────────────────────────────────

    @Transactional
    public void changePassword(String nationalId, ChangePasswordRequest req, HttpServletRequest httpReq) {
        Employee emp = employeeRepository.findByNationalId(nationalId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        if (!passwordEncoder.matches(req.getCurrentPassword(), emp.getPasswordHash())) {
            auditService.log(AuditService.LOGIN_FAILURE, emp,
                    Map.of("reason", "change_password_wrong_current"), httpReq);
            throw new IllegalArgumentException("Current password is incorrect");
        }

        emp.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        emp.setPasswordChangedAt(OffsetDateTime.now());
        emp.setMustChangePassword(false);   // clear forced-change flag set by admin creation
        employeeRepository.save(emp);

        // Revoke all refresh sessions — user must re-login on all devices
        int revoked = refreshTokenService.revokeAllForEmployee(emp.getId());

        auditService.log(AuditService.PASSWORD_CHANGED, emp,
                Map.of("sessionsRevoked", revoked), httpReq);
        log.info("[AUTH] Password changed for nationalId={} — {} sessions revoked",
                mask(nationalId), revoked);
    }

    // ── Session Management ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SessionDto> getSessions(String nationalId) {
        Employee emp = employeeRepository.findByNationalId(nationalId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        return refreshTokenRepository
                .findActiveByEmployeeId(emp.getId(), OffsetDateTime.now())
                .stream()
                .map(s -> SessionDto.builder()
                        .id(s.getId().toString())
                        .deviceInfo(s.getDeviceInfo())
                        .issuedAt(s.getIssuedAt())
                        .expiresAt(s.getExpiresAt())
                        .lastUsedAt(s.getLastUsedAt())
                        .build())
                .toList();
    }

    @Transactional
    public void revokeSession(String nationalId, UUID sessionId, HttpServletRequest httpReq) {
        Employee emp = employeeRepository.findByNationalId(nationalId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        RefreshTokenSession session = refreshTokenRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        // Security: ensure the session belongs to this employee
        if (!session.getEmployee().getId().equals(emp.getId())) {
            throw new SecurityException("Session does not belong to this account");
        }

        if (!session.isRevoked()) {
            session.setRevokedAt(OffsetDateTime.now());
            refreshTokenRepository.save(session);
        }

        auditService.log(AuditService.SESSION_REVOKED, emp,
                Map.of("sessionId", sessionId.toString()), httpReq);
    }

    @Transactional
    public void logoutAll(String bearerHeader, HttpServletRequest httpReq) {
        if (bearerHeader == null || !bearerHeader.startsWith("Bearer ")) return;
        String token   = bearerHeader.substring(7);
        String jti     = jwtService.extractJti(token);
        String natId   = jwtService.extractSubjectUnchecked(token);
        Instant expiry = jwtService.extractExpiry(token);

        Employee emp = null;
        try { emp = employeeRepository.findByNationalId(natId).orElse(null); } catch (Exception ignored) {}

        if (jti != null) {
            blacklistService.revoke(jti, emp,
                    expiry != null
                        ? OffsetDateTime.ofInstant(expiry, ZoneOffset.UTC)
                        : OffsetDateTime.now().plusMinutes(jwtService.getAccessExpiryMinutes()),
                    "LOGOUT_ALL");
        }

        int revoked = 0;
        if (emp != null) {
            revoked = refreshTokenService.revokeAllForEmployee(emp.getId());
        }

        auditService.log(AuditService.LOGOUT_ALL, emp,
                Map.of("maskedId", mask(natId), "sessionsRevoked", revoked), httpReq);
        log.info("[AUTH] Logout-all: {} — {} sessions revoked", mask(natId), revoked);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private String generateOtp() {
        return String.valueOf(100_000 + secureRandom.nextInt(900_000));
    }

    private String mask(String id) {
        if (id == null || id.length() < 4) return "****";
        return "*".repeat(id.length() - 4) + id.substring(id.length() - 4);
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "****";
        return "*".repeat(phone.length() - 4) + phone.substring(phone.length() - 4);
    }

    private String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max) : s;
    }

    /** Builds the full Arabic display name, including middle name when present. */
    private static String fullNameAr(Employee emp) {
        String mid = emp.getMiddleNameAr();
        if (mid != null && !mid.isBlank()) {
            return emp.getFirstNameAr() + " " + mid.trim() + " " + emp.getLastNameAr();
        }
        return emp.getFirstNameAr() + " " + emp.getLastNameAr();
    }
}
