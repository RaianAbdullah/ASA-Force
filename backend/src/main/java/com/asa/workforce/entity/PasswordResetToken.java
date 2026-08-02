package com.asa.workforce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Single-use password reset token.
 *
 * Security:
 *   - Raw token is NEVER stored — only a SHA-256 hex hash.
 *   - Expires after a short window (default: 15 min, configurable).
 *   - Consumed on first use (used_at is set, further use is rejected).
 *   - Old tokens for the same employee are invalidated when a new one is issued.
 */
@Entity
@Table(name = "password_reset_tokens")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64, columnDefinition = "VARCHAR(64)")
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "used_at")
    private OffsetDateTime usedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public boolean isExpired() { return OffsetDateTime.now().isAfter(expiresAt); }
    public boolean isUsed()    { return usedAt != null; }
    public boolean isValid()   { return !isExpired() && !isUsed(); }
}
