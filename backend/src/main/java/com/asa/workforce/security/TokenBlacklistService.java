package com.asa.workforce.security;

import com.asa.workforce.entity.Employee;
import com.asa.workforce.entity.TokenBlacklist;
import com.asa.workforce.repository.TokenBlacklistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * JWT revocation via a persistent blacklist keyed on the jti claim.
 *
 * Every authenticated request checks isBlacklisted() — O(1) indexed lookup.
 * Expired rows are purged every 15 minutes so the table stays small.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private final TokenBlacklistRepository repository;

    /**
     * Returns true if the given jti has been revoked.
     * Called on every authenticated request.
     */
    @Transactional(readOnly = true)
    public boolean isBlacklisted(String jti) {
        if (jti == null || jti.isBlank()) return false;
        try {
            return repository.existsByJti(UUID.fromString(jti));
        } catch (IllegalArgumentException e) {
            // Malformed jti — treat as blacklisted (invalid token)
            return true;
        }
    }

    /**
     * Revokes a token identified by its jti.
     *
     * @param jti       The jti claim value from the JWT
     * @param employee  The token owner (may be null if employee record unavailable)
     * @param expiresAt When the token would have expired — keeps the row only as long as needed
     * @param reason    Short label e.g. "LOGOUT", "ADMIN_REVOKE", "ACCOUNT_SUSPENDED"
     */
    @Transactional
    public void revoke(String jti, Employee employee, OffsetDateTime expiresAt, String reason) {
        if (jti == null || jti.isBlank()) return;
        try {
            UUID jtiUuid = UUID.fromString(jti);
            if (repository.existsByJti(jtiUuid)) return; // already revoked
            repository.save(TokenBlacklist.builder()
                    .jti(jtiUuid)
                    .employee(employee)
                    .reason(reason)
                    .expiresAt(expiresAt)
                    .build());
            log.info("[SECURITY] Token revoked: jti={} reason={}", jtiUuid, reason);
        } catch (IllegalArgumentException e) {
            log.warn("[SECURITY] Attempted to revoke token with malformed jti: {}", jti);
        }
    }

    /** Purge rows whose tokens have expired — they can never be replayed anyway. */
    @Scheduled(fixedDelay = 15 * 60_000)
    @Transactional
    public void purgeExpired() {
        int removed = repository.deleteExpiredBefore(OffsetDateTime.now());
        if (removed > 0) {
            log.debug("[SECURITY] Purged {} expired token blacklist entries", removed);
        }
    }
}
