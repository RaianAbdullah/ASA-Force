package com.asa.workforce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * A revoked JWT — keyed by its jti claim.
 * Rows are retained until expires_at, then cleaned up by a scheduler.
 */
@Entity
@Table(name = "token_blacklist")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TokenBlacklist {

    @Id
    private UUID jti;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(nullable = false, length = 50)
    private String reason;

    @CreationTimestamp
    @Column(name = "blacklisted_at", updatable = false)
    private OffsetDateTime blacklistedAt;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;
}
