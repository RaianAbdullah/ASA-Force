package com.asa.workforce.repository;

import com.asa.workforce.entity.PushToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PushTokenRepository extends JpaRepository<PushToken, UUID> {

    Optional<PushToken> findByToken(String token);

    /** All tokens for a specific employee */
    List<PushToken> findByEmployeeId(UUID employeeId);

    /** Collect push tokens for SYSTEM_ADMIN and MAIN_MANAGER (registration approvers) */
    @Query("""
        SELECT pt.token FROM PushToken pt
        WHERE pt.employee.role IN ('SYSTEM_ADMIN', 'MAIN_MANAGER')
          AND pt.employee.status = 'ACTIVE'
    """)
    List<String> findAdminPushTokens();

    /** Collect push tokens for a specific employee */
    @Query("SELECT pt.token FROM PushToken pt WHERE pt.employee.id = :employeeId")
    List<String> findTokensByEmployeeId(UUID employeeId);

    /** Collect push tokens for all active WEEKEND_MANAGERs */
    @Query("""
        SELECT pt.token FROM PushToken pt
        WHERE pt.employee.role = 'WEEKEND_MANAGER'
          AND pt.employee.status = 'ACTIVE'
    """)
    List<String> findWeekendManagerPushTokens();
}
