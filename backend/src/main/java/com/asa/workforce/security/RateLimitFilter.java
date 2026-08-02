package com.asa.workforce.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Per-IP rate limiting for all sensitive endpoints.
 *
 * Limits (sliding window per IP):
 *   POST /v1/auth/register    →  3 / hour
 *   POST /v1/auth/verify-otp  → 10 / hour  (per-account limit also in AuthService)
 *   POST /v1/auth/login       → 10 / hour  (per-account limit also in AuthService)
 *   GET  /v1/auth/status/**   → 20 / hour  (account enumeration protection)
 *   POST /v1/auth/logout      → 10 / hour
 *   /v1/admin/**              → 200 / hour
 *
 * Returns 429 Too Many Requests with a JSON body and a Retry-After header.
 *
 * IP extraction: trusts X-Forwarded-For only when the request arrives from
 * a known trusted proxy range (configured via app.trusted-proxy-cidrs).
 * Falls back to remoteAddr otherwise, preventing IP spoofing.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;

    @Value("${app.trusted-proxy-cidrs:}")
    private String trustedProxyCidrs;

    private static final String JSON_429 =
            "{\"success\":false,\"error\":{\"code\":\"RATE_LIMITED\"," +
            "\"message\":\"Too many requests. Please try again later.\"}}";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest  request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain         chain)
            throws ServletException, IOException {

        String ip   = extractIp(request);
        String path = request.getRequestURI();
        String method = request.getMethod();

        RateLimitResult result = check(path, method, ip);

        if (!result.allowed()) {
            long retryAfterSeconds = result.windowMs() / 1000;
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.setHeader("X-RateLimit-Limit",     String.valueOf(result.max()));
            response.setHeader("X-RateLimit-Remaining", "0");
            response.setHeader("X-RateLimit-Reset",
                    String.valueOf(System.currentTimeMillis() / 1000 + retryAfterSeconds));
            response.getWriter().write(JSON_429);
            return;
        }

        // Pass remaining count to downstream if needed
        response.setHeader("X-RateLimit-Limit",     String.valueOf(result.max()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.remaining()));

        chain.doFilter(request, response);
    }

    private RateLimitResult check(String path, String method, String ip) {
        if ("POST".equals(method) && path.equals("/api/v1/auth/register")) {
            return rate(ip, "register", RateLimitService.REGISTER_MAX, RateLimitService.REGISTER_WIN);

        } else if ("POST".equals(method) && path.equals("/api/v1/auth/verify-otp")) {
            return rate(ip, "otp", RateLimitService.OTP_IP_MAX, RateLimitService.OTP_IP_WIN);

        } else if ("POST".equals(method) && path.equals("/api/v1/auth/login")) {
            return rate(ip, "login", RateLimitService.LOGIN_MAX, RateLimitService.LOGIN_WIN);

        } else if ("GET".equals(method) && path.startsWith("/api/v1/auth/status/")) {
            return rate(ip, "status", RateLimitService.STATUS_MAX, RateLimitService.STATUS_WIN);

        } else if ("POST".equals(method) && path.equals("/api/v1/auth/refresh")) {
            return rate(ip, "refresh", RateLimitService.REFRESH_MAX, RateLimitService.REFRESH_WIN);

        } else if ("POST".equals(method) && path.equals("/api/v1/auth/resend-otp")) {
            return rate(ip, "resend-otp", RateLimitService.RESEND_OTP_MAX, RateLimitService.RESEND_OTP_WIN);

        } else if ("POST".equals(method) && path.equals("/api/v1/auth/forgot-password")) {
            return rate(ip, "forgot", RateLimitService.FORGOT_MAX, RateLimitService.FORGOT_WIN);

        } else if ("POST".equals(method) && path.equals("/api/v1/auth/reset-password")) {
            return rate(ip, "reset", RateLimitService.RESET_MAX, RateLimitService.RESET_WIN);

        } else if ("POST".equals(method) && path.equals("/api/v1/auth/change-password")) {
            return rate(ip, "changepw", RateLimitService.CHANGE_PW_MAX, RateLimitService.CHANGE_PW_WIN);

        } else if ("POST".equals(method) && path.equals("/api/v1/auth/logout")) {
            return rate(ip, "logout", RateLimitService.LOGOUT_MAX, RateLimitService.LOGOUT_WIN);

        } else if (path.startsWith("/api/v1/admin/")) {
            return rate(ip, "admin", RateLimitService.ADMIN_MAX, RateLimitService.ADMIN_WIN);

        } else {
            return RateLimitResult.unlimited();
        }
    }

    private RateLimitResult rate(String ip, String bucket, int max, long windowMs) {
        String key = bucket + ":" + ip;
        boolean allowed = rateLimitService.isAllowed(key, max, windowMs);
        int remaining   = rateLimitService.remaining(key, max, windowMs);
        return new RateLimitResult(allowed, max, remaining, windowMs);
    }

    /**
     * Extracts the client IP.
     *
     * Only trusts X-Forwarded-For when the direct connection comes from a
     * configured trusted proxy. Otherwise uses remoteAddr to prevent spoofing.
     *
     * Without trusted-proxy-cidrs set (the default), always uses remoteAddr —
     * safe for single-server deployments without a reverse proxy.
     */
    private String extractIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();

        if (trustedProxyCidrs == null || trustedProxyCidrs.isBlank()) {
            return remoteAddr; // No trusted proxies configured — trust remoteAddr only
        }

        // Only trust X-Forwarded-For when the direct connection is from a known proxy
        if (isTrustedProxy(remoteAddr)) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                // Take the LAST (rightmost) IP added by a trusted proxy,
                // not the first (which the client can forge)
                String[] parts = forwarded.split(",");
                return parts[parts.length - 1].trim();
            }
        }

        return remoteAddr;
    }

    private boolean isTrustedProxy(String ip) {
        if (trustedProxyCidrs == null || trustedProxyCidrs.isBlank()) return false;
        for (String cidr : trustedProxyCidrs.split(",")) {
            if (ip.startsWith(cidr.trim())) return true; // Simple prefix match
        }
        return false;
    }

    // ── Result record ─────────────────────────────────────────────────────────

    private record RateLimitResult(boolean allowed, int max, int remaining, long windowMs) {
        static RateLimitResult unlimited() {
            return new RateLimitResult(true, Integer.MAX_VALUE, Integer.MAX_VALUE, 0);
        }
    }
}
