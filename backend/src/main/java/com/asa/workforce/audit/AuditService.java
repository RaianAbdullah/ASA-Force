package com.asa.workforce.audit;

import com.asa.workforce.entity.AuditLog;
import com.asa.workforce.entity.Employee;
import com.asa.workforce.repository.AuditLogRepository;
import com.asa.workforce.repository.EmployeeRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

/**
 * Writes immutable audit records for every security-relevant action.
 *
 * All writes are:
 * - Async       (non-blocking for the caller)
 * - REQUIRES_NEW transaction (persists even if the caller's transaction rolls back)
 *
 * IP extraction only trusts X-Forwarded-For when running behind a configured
 * trusted proxy. Without that config, remoteAddr is always used to prevent
 * IP address spoofing in audit records.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final EmployeeRepository employeeRepository;

    @Value("${app.trusted-proxy-cidrs:}")
    private String trustedProxyCidrs;

    // ── Actions ───────────────────────────────────────────────────────────────

    public static final String LOGIN_SUCCESS      = "AUTH_LOGIN_SUCCESS";
    public static final String LOGIN_FAILURE      = "AUTH_LOGIN_FAILURE";
    public static final String LOGIN_LOCKED       = "AUTH_LOGIN_LOCKED";
    public static final String LOGOUT             = "AUTH_LOGOUT";
    public static final String REGISTER           = "AUTH_REGISTER";
    public static final String OTP_VERIFY_SUCCESS = "AUTH_OTP_VERIFIED";
    public static final String OTP_VERIFY_FAILURE = "AUTH_OTP_FAILURE";
    public static final String OTP_LOCKED         = "AUTH_OTP_LOCKED";
    public static final String ADMIN_APPROVE      = "ADMIN_EMPLOYEE_APPROVED";
    public static final String ADMIN_REJECT       = "ADMIN_EMPLOYEE_REJECTED";
    public static final String ADMIN_PENDING_VIEW = "ADMIN_PENDING_LIST_VIEWED";
    public static final String PUSH_TOKEN_REG     = "PUSH_TOKEN_REGISTERED";
    public static final String CHECK_IN           = "ATTENDANCE_CHECK_IN";
    public static final String CHECK_OUT          = "ATTENDANCE_CHECK_OUT";
    public static final String TOKEN_REVOKED           = "AUTH_TOKEN_REVOKED";
    public static final String REFRESH_SUCCESS          = "AUTH_REFRESH_SUCCESS";
    public static final String REFRESH_REUSE_DETECTED  = "AUTH_REFRESH_REUSE_DETECTED";
    public static final String FORGOT_PASSWORD         = "AUTH_FORGOT_PASSWORD";
    public static final String PASSWORD_RESET          = "AUTH_PASSWORD_RESET";
    public static final String PASSWORD_CHANGED        = "AUTH_PASSWORD_CHANGED";
    public static final String LOGOUT_ALL              = "AUTH_LOGOUT_ALL";
    public static final String SESSION_REVOKED         = "AUTH_SESSION_REVOKED";

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Primary log method. Extracts IP/UA from the request SYNCHRONOUSLY on the
     * caller's thread before handing off to the async executor — Tomcat recycles
     * the request object immediately after the controller returns, so we must not
     * read it inside the @Async thread.
     */
    public void log(String action,
                    Employee actor,
                    String resourceType,
                    UUID resourceId,
                    Map<String, Object> details,
                    HttpServletRequest request) {
        String ip = extractIp(request);
        String ua = extractUserAgent(request);
        UUID actorId = actor != null ? actor.getId() : null;
        doLog(action, actorId, resourceType, resourceId, details, ip, ua);
    }

    /** Convenience — log without a resource. */
    public void log(String action, Employee actor, Map<String, Object> details,
                    HttpServletRequest request) {
        log(action, actor, null, null, details, request);
    }

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected void doLog(String action, UUID actorId,
                         String resourceType, UUID resourceId,
                         Map<String, Object> details, String ip, String ua) {
        try {
            Employee managedActor = null;
            if (actorId != null) {
                managedActor = employeeRepository.findById(actorId).orElse(null);
            }
            AuditLog entry = AuditLog.builder()
                    .action(action)
                    .actor(managedActor)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .details(details)
                    .ipAddress(ip)
                    .userAgent(ua)
                    .build();
            auditLogRepository.save(entry);
            log.debug("[AUDIT] {} actor={} resource={}:{}",
                    action,
                    managedActor != null ? managedActor.getNationalId() : "anonymous",
                    resourceType, resourceId);
        } catch (Exception ex) {
            log.error("[AUDIT] Failed to persist audit record: {}", ex.getMessage(), ex);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Extracts the client IP address.
     *
     * X-Forwarded-For is only trusted when the direct TCP connection comes from
     * a configured trusted proxy CIDR range. Without trusted-proxy-cidrs set,
     * remoteAddr is always used — safe default for single-server deployments.
     *
     * When trusted, we take the LAST IP in the X-Forwarded-For chain (added by
     * the trusted proxy itself) rather than the first (which the client controls).
     */
    private String extractIp(HttpServletRequest request) {
        if (request == null) return null;
        String remoteAddr = request.getRemoteAddr();

        if (trustedProxyCidrs == null || trustedProxyCidrs.isBlank()) {
            return remoteAddr;
        }

        if (isTrustedProxy(remoteAddr)) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                String[] parts = forwarded.split(",");
                return parts[parts.length - 1].trim();
            }
        }

        return remoteAddr;
    }

    private boolean isTrustedProxy(String ip) {
        if (ip == null || trustedProxyCidrs == null || trustedProxyCidrs.isBlank()) return false;
        for (String cidr : trustedProxyCidrs.split(",")) {
            if (ip.startsWith(cidr.trim())) return true;
        }
        return false;
    }

    private String extractUserAgent(HttpServletRequest request) {
        if (request == null) return null;
        String ua = request.getHeader("User-Agent");
        return ua != null && ua.length() > 512 ? ua.substring(0, 512) : ua;
    }
}
