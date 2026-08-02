package com.asa.workforce.security;

import com.asa.workforce.entity.Employee;
import com.asa.workforce.entity.RefreshTokenSession;
import com.asa.workforce.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * Manages rotating refresh tokens.
 *
 * Security design:
 *   1. Raw token: 32 bytes of SecureRandom → Base64URL-encoded (43 chars, URL safe).
 *   2. Only the SHA-256 hash is stored in the DB — raw never persisted.
 *   3. Every use rotates the token (revoke old, create new).
 *   4. If a revoked token is reused → entire family revoked (all sessions for that login chain).
 *   5. Expired rows are purged every hour by a scheduled task.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private static final int RAW_BYTES   = 32;   // 256 bits of entropy
    private static final SecureRandom RNG = new SecureRandom();

    private final RefreshTokenRepository refreshRepo;

    @Value("${jwt.refresh-expiry-days:3}")
    private int refreshExpiryDays;

    // ── Create ────────────────────────────────────────────────────────────────

    /**
     * Issues a brand-new refresh token for a fresh login (new family UUID).
     *
     * @return the raw token — caller must return it to the client and never store it
     */
    @Transactional
    public String createForEmployee(Employee employee, String deviceInfo) {
        String rawToken = generateRaw();
        String hash     = sha256Hex(rawToken);
        UUID   family   = UUID.randomUUID();

        RefreshTokenSession session = RefreshTokenSession.builder()
                .employee(employee)
                .tokenHash(hash)
                .tokenFamily(family)
                .deviceInfo(deviceInfo)
                .expiresAt(OffsetDateTime.now().plusDays(refreshExpiryDays))
                .reuseDetected(false)
                .build();

        refreshRepo.save(session);
        log.debug("[REFRESH] Created token family={} employee={}", family, employee.getId());
        return rawToken;
    }

    // ── Rotate ────────────────────────────────────────────────────────────────

    /**
     * Validates a raw refresh token and rotates it.
     *
     * Returns a RotationResult with the new raw token and associated Employee on success.
     * Throws on any failure (expired, revoked, reuse detected, not found).
     */
    @Transactional
    public RotationResult rotate(String rawToken) {
        String hash = sha256Hex(rawToken);

        RefreshTokenSession session = refreshRepo.findByTokenHash(hash)
                .orElseThrow(() -> {
                    log.warn("[REFRESH] Unknown token hash presented — possible attack");
                    return new SecurityException("Invalid refresh token");
                });

        // ── Reuse detection ──────────────────────────────────────────────────
        if (session.isRevoked()) {
            // A previously revoked token was used again — compromise assumed.
            // Revoke the entire family to force all devices to re-authenticate.
            int revoked = refreshRepo.revokeFamily(session.getTokenFamily(), OffsetDateTime.now());
            session.setReuseDetected(true);
            refreshRepo.save(session);
            log.error("[SECURITY] Refresh token reuse detected! family={} employee={} — revoked {} sessions",
                    session.getTokenFamily(), session.getEmployee().getId(), revoked);
            throw new SecurityException("Refresh token reuse detected — all sessions revoked");
        }

        if (session.isExpired()) {
            throw new SecurityException("Refresh token has expired");
        }

        // ── Rotate ───────────────────────────────────────────────────────────
        String newRaw  = generateRaw();
        String newHash = sha256Hex(newRaw);

        RefreshTokenSession newSession = RefreshTokenSession.builder()
                .employee(session.getEmployee())
                .tokenHash(newHash)
                .tokenFamily(session.getTokenFamily())   // inherit family
                .deviceInfo(session.getDeviceInfo())
                .expiresAt(OffsetDateTime.now().plusDays(refreshExpiryDays))
                .reuseDetected(false)
                .build();

        newSession = refreshRepo.save(newSession);

        // Mark old session as revoked and point to its replacement
        session.setRevokedAt(OffsetDateTime.now());
        session.setLastUsedAt(OffsetDateTime.now());
        session.setReplacedById(newSession.getId());
        refreshRepo.save(session);

        log.debug("[REFRESH] Rotated family={} employee={}", session.getTokenFamily(), session.getEmployee().getId());
        return new RotationResult(newRaw, session.getEmployee());
    }

    // ── Revoke ────────────────────────────────────────────────────────────────

    /** Revoke a specific refresh token (called on logout). */
    @Transactional
    public void revokeToken(String rawToken) {
        String hash = sha256Hex(rawToken);
        Optional<RefreshTokenSession> session = refreshRepo.findByTokenHash(hash);
        session.ifPresent(s -> {
            if (!s.isRevoked()) {
                s.setRevokedAt(OffsetDateTime.now());
                refreshRepo.save(s);
                log.debug("[REFRESH] Token revoked employee={}", s.getEmployee().getId());
            }
        });
    }

    /** Revoke ALL refresh tokens for an employee (logout-all / password change / suspension). */
    @Transactional
    public int revokeAllForEmployee(UUID employeeId) {
        int count = refreshRepo.revokeAllByEmployee(employeeId, OffsetDateTime.now());
        log.info("[REFRESH] Revoked {} sessions for employee={}", count, employeeId);
        return count;
    }

    // ── Maintenance ───────────────────────────────────────────────────────────

    /** Purge expired rows — runs every hour. Keeps the table lean. */
    @Scheduled(fixedRateString = "PT1H")
    @Transactional
    public void purgeExpired() {
        // Keep rows for 1 extra day after expiry so reuse-detection logs remain visible
        OffsetDateTime cutoff = OffsetDateTime.now().minusDays(1);
        int deleted = refreshRepo.deleteExpiredBefore(cutoff);
        if (deleted > 0) {
            log.info("[REFRESH] Purged {} expired refresh token rows", deleted);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static String generateRaw() {
        byte[] bytes = new byte[RAW_BYTES];
        RNG.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    // ── Result type ───────────────────────────────────────────────────────────

    public record RotationResult(String newRawToken, Employee employee) {}
}
