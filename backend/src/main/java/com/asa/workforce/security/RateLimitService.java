package com.asa.workforce.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * In-memory sliding-window rate limiter.
 *
 * Each bucket is keyed by "endpoint:clientIp".
 * Thread-safe: ConcurrentHashMap + ConcurrentLinkedDeque.
 *
 * Note: in-memory only — limits do not share across multiple instances.
 * For multi-instance deployments, replace with a Redis-backed implementation.
 */
@Service
@Slf4j
public class RateLimitService {

    // ── Limits ───────────────────────────────────────────────────────────────

    public static final int  REGISTER_MAX  = 3;
    public static final long REGISTER_WIN  = 60 * 60_000L;  // per hour per IP

    public static final int  OTP_IP_MAX    = 10;
    public static final long OTP_IP_WIN    = 60 * 60_000L;

    public static final int  LOGIN_MAX     = 10;
    public static final long LOGIN_WIN     = 60 * 60_000L;

    public static final int  STATUS_MAX    = 20;             // account enumeration protection
    public static final long STATUS_WIN    = 60 * 60_000L;

    public static final int  LOGOUT_MAX    = 10;
    public static final long LOGOUT_WIN    = 60 * 60_000L;

    public static final int  REFRESH_MAX      = 30;
    public static final long REFRESH_WIN      = 60 * 60_000L;

    public static final int  RESEND_OTP_MAX   = 5;           // strict — prevents OTP churn abuse
    public static final long RESEND_OTP_WIN   = 60 * 60_000L;

    public static final int  FORGOT_MAX       = 5;           // strict — prevents enumeration
    public static final long FORGOT_WIN       = 60 * 60_000L;

    public static final int  RESET_MAX        = 5;
    public static final long RESET_WIN        = 60 * 60_000L;

    public static final int  CHANGE_PW_MAX    = 5;
    public static final long CHANGE_PW_WIN    = 60 * 60_000L;

    public static final int  ADMIN_MAX     = 1000;   // admin users legitimately make many requests
    public static final long ADMIN_WIN     = 60 * 60_000L;

    // ── State ────────────────────────────────────────────────────────────────

    private final Map<String, Deque<Long>> buckets = new ConcurrentHashMap<>();

    // ── Public API ───────────────────────────────────────────────────────────

    /**
     * Returns true if the request is allowed; false if limit is exceeded.
     *
     * @param key       unique bucket key, e.g. "login:1.2.3.4"
     * @param maxEvents maximum number of events in the window
     * @param windowMs  window duration in milliseconds
     */
    public boolean isAllowed(String key, int maxEvents, long windowMs) {
        Deque<Long> timestamps = buckets.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());
        long now    = System.currentTimeMillis();
        long cutoff = now - windowMs;

        // Prune expired entries from the front
        while (!timestamps.isEmpty() && timestamps.peekFirst() < cutoff) {
            timestamps.pollFirst();
        }

        if (timestamps.size() >= maxEvents) {
            log.warn("[RATE-LIMIT] Bucket '{}' exceeded ({}/{} in {}s window)",
                    key, timestamps.size(), maxEvents, windowMs / 1000);
            return false;
        }

        timestamps.addLast(now);
        return true;
    }

    /** Remaining capacity for a key (for X-RateLimit-Remaining header). */
    public int remaining(String key, int maxEvents, long windowMs) {
        Deque<Long> d = buckets.get(key);
        if (d == null) return maxEvents;
        long cutoff = System.currentTimeMillis() - windowMs;
        long active = d.stream().filter(t -> t >= cutoff).count();
        return Math.max(0, (int) (maxEvents - active));
    }

    // ── Cleanup ──────────────────────────────────────────────────────────────

    /** Purge stale buckets every 5 minutes to prevent memory growth. */
    @Scheduled(fixedDelay = 5 * 60_000)
    void evictStaleBuckets() {
        long cutoff = System.currentTimeMillis() - Math.max(REGISTER_WIN, LOGIN_WIN);
        int removed = 0;
        for (var entry : buckets.entrySet()) {
            Deque<Long> d = entry.getValue();
            while (!d.isEmpty() && d.peekFirst() < cutoff) d.pollFirst();
            if (d.isEmpty()) {
                buckets.remove(entry.getKey());
                removed++;
            }
        }
        if (removed > 0) log.debug("[RATE-LIMIT] Evicted {} stale buckets", removed);
    }
}
