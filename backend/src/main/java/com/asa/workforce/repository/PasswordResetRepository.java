package com.asa.workforce.repository;

import com.asa.workforce.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /** Invalidate all unused, unexpired tokens for this employee before issuing a new one. */
    @Modifying
    @Transactional
    @Query("""
        UPDATE PasswordResetToken t
        SET t.usedAt = :now
        WHERE t.employee.id = :employeeId
          AND t.usedAt IS NULL
          AND t.expiresAt > :now
    """)
    int invalidatePreviousTokens(@Param("employeeId") UUID employeeId, @Param("now") OffsetDateTime now);

    /** Purge expired/used rows — called by scheduled cleanup. */
    @Modifying
    @Transactional
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :cutoff OR t.usedAt IS NOT NULL")
    int purgeStale(@Param("cutoff") OffsetDateTime cutoff);
}
