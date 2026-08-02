package com.asa.workforce.security;

import com.asa.workforce.entity.Employee;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

/**
 * Issues and validates HS512 JWTs.
 *
 * Security requirements:
 *   - JWT_SECRET env-var MUST be set in production (≥ 64 bytes for HS512).
 *   - A dev-only default is accepted in development; it causes a hard startup
 *     failure if the active profile is "production".
 *   - Every token carries a jti (UUID) for revocation support.
 *   - Issuer claim is validated on parse to prevent token reuse across services.
 */
@Service
@Slf4j
public class JwtService {

    static final String ISSUER = "asa-force";

    private static final String DEV_DEFAULT =
            "ASA_WORKFORCE_DEV_ONLY_INSECURE_SECRET_SET_JWT_SECRET_IN_PRODUCTION_64_BYTES_MIN!!";

    private static final int MIN_KEY_BYTES = 64; // HS512 recommended minimum

    @Value("${jwt.secret:" + DEV_DEFAULT + "}")
    private String secret;

    @Value("${jwt.access-expiry-minutes:15}")
    private int accessExpiryMinutes;

    @Value("${spring.profiles.active:development}")
    private String activeProfile;

    public int getAccessExpiryMinutes() { return accessExpiryMinutes; }

    private SecretKey key;

    @PostConstruct
    void init() {
        boolean usingDefault = DEV_DEFAULT.equals(secret);

        // Hard fail in production — insecure default must never run in prod
        if (usingDefault && "production".equals(activeProfile)) {
            throw new IllegalStateException(
                    "JWT_SECRET environment variable is not set. " +
                    "The application cannot start in production without a secure secret. " +
                    "Generate one with: openssl rand -base64 64");
        }

        if (usingDefault) {
            log.error("╔═══════════════════════════════════════════════════════════════╗");
            log.error("║  SECURITY WARNING: JWT_SECRET is not set!                    ║");
            log.error("║  Using insecure development default. Set JWT_SECRET before   ║");
            log.error("║  any staging or production deployment.                       ║");
            log.error("║  Generate: openssl rand -base64 64                           ║");
            log.error("╚═══════════════════════════════════════════════════════════════╝");
        }

        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < MIN_KEY_BYTES) {
            throw new IllegalStateException(
                    "JWT secret is too short (" + keyBytes.length + " bytes). " +
                    "HS512 requires at least " + MIN_KEY_BYTES + " bytes. " +
                    "Generate one with: openssl rand -base64 64");
        }

        this.key = Keys.hmacShaKeyFor(keyBytes);
        log.info("[JWT] Initialized — access-expiry={}m, keyBytes={}, issuer={}",
                accessExpiryMinutes, keyBytes.length, ISSUER);
    }

    // ── Token generation ─────────────────────────────────────────────────────

    public String generateToken(Employee employee) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(ISSUER)
                .subject(employee.getNationalId())
                .id(UUID.randomUUID().toString())          // jti — used for revocation
                .claim("employeeId", employee.getId().toString())
                .claim("role",       employee.getRole().name())
                .claim("name",       employee.getFirstNameAr() + " " + employee.getLastNameAr())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessExpiryMinutes, ChronoUnit.MINUTES)))
                .signWith(key, Jwts.SIG.HS512)
                .compact();
    }

    // ── Token parsing ────────────────────────────────────────────────────────

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer(ISSUER)      // Reject tokens not issued by this service
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.debug("JWT expired");
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT invalid: {}", e.getMessage());
        }
        return false;
    }

    /** Extract token expiry for blacklist TTL — returns null if token is unparseable. */
    public Instant extractExpiry(String token) {
        try {
            Date exp = parseToken(token).getExpiration();
            return exp != null ? exp.toInstant() : null;
        } catch (Exception e) {
            return null;
        }
    }

    /** Extract the jti without full validation — used only after isValid() passes. */
    public String extractJti(String token) {
        try {
            return parseToken(token).getId();
        } catch (Exception e) {
            return null;
        }
    }

    /** Extract the nationalId (subject) — only for logging, not auth decisions. */
    public String extractSubjectUnchecked(String token) {
        try {
            return parseToken(token).getSubject();
        } catch (Exception e) {
            return "unknown";
        }
    }
}
