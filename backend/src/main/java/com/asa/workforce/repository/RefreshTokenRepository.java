package com.asa.workforce.repository;

import com.asa.workforce.entity.RefreshTokenSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshTokenSession, UUID> {

    Optional<RefreshTokenSession> findByTokenHash(String tokenHash);

    List<RefreshTokenSession> findAllByTokenFamily(UUID tokenFamily);

    /** All active (non-revoked, non-expired) sessions for an employee — used for session list. */
    @Query("""
        SELECT r FROM RefreshTokenSession r
        WHERE r.employee.id = :employeeId
          AND r.revokedAt IS NULL
          AND r.expiresAt > :now
        ORDER BY r.issuedAt DESC
    """)
    List<RefreshTokenSession> findActiveByEmployeeId(
            @Param("employeeId") UUID employeeId,
            @Param("now") OffsetDateTime now);

    /** Revoke all non-revoked sessions in a family — used for reuse detection. */
    @Modifying
    @Transactional
    @Query("""
        UPDATE RefreshTokenSession r
        SET r.revokedAt = :now, r.reuseDetected = true
        WHERE r.tokenFamily = :family AND r.revokedAt IS NULL
    """)
    int revokeFamily(@Param("family") UUID family, @Param("now") OffsetDateTime now);

    /** Revoke all sessions for an employee — logout-all / password change / account suspension. */
    @Modifying
    @Transactional
    @Query("""
        UPDATE RefreshTokenSession r
        SET r.revokedAt = :now
        WHERE r.employee.id = :employeeId AND r.revokedAt IS NULL
    """)
    int revokeAllByEmployee(@Param("employeeId") UUID employeeId, @Param("now") OffsetDateTime now);

    /** Purge fully expired rows older than the given cutoff — called by scheduled task. */
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshTokenSession r WHERE r.expiresAt < :cutoff")
    int deleteExpiredBefore(@Param("cutoff") OffsetDateTime cutoff);
}
