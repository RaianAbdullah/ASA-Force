package com.asa.workforce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Represents one issued refresh token.
 *
 * Security design:
 *   - Raw token is NEVER stored — only a SHA-256 hex hash.
 *   - token_family groups all rotations of the same original login session.
 *   - If a revoked token is presented again, the entire family is revoked (reuse detection).
 *   - Expired rows are purged by RefreshTokenService scheduled task.
 */
@Entity
@Table(name = "refresh_token_sessions")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RefreshTokenSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    /** SHA-256 hex of the raw token. */
    @Column(name = "token_hash", nullable = false, unique = true, length = 64, columnDefinition = "VARCHAR(64)")
    private String tokenHash;

    /** Shared across all rotations from the same login — enables family revocation. */
    @Column(name = "token_family", nullable = false)
    private UUID tokenFamily;

    /** Opaque device hint from User-Agent — never used for auth decisions. */
    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @CreationTimestamp
    @Column(name = "issued_at", nullable = false, updatable = false)
    private OffsetDateTime issuedAt;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "revoked_at")
    private OffsetDateTime revokedAt;

    /** Points to the token that replaced this one during rotation. */
    @Column(name = "replaced_by_id")
    private UUID replacedById;

    /** Set to true when a previously revoked token in this family was used again. */
    @Column(name = "reuse_detected", nullable = false)
    private boolean reuseDetected;

    @Column(name = "last_used_at")
    private OffsetDateTime lastUsedAt;

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public boolean isExpired() {
        return OffsetDateTime.now().isAfter(expiresAt);
    }

    public boolean isActive() {
        return !isRevoked() && !isExpired();
    }
}
