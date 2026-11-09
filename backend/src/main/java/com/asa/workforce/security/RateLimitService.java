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

    @org.springframework.beans.factory.annotation.Autowired
    private SharedRateLimitStore sharedStore;
    @org.springframework.beans.factory.annotation.Value("${app.rate-limit.shared:false}")
    private boolean shared;

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
        if (shared) return sharedStore.allowed(key, maxEvents, windowMs);
        java.util.concurrent.atomic.AtomicBoolean allowed = new java.util.concurrent.atomic.AtomicBoolean();
        long now = System.currentTimeMillis();
        buckets.compute(key, (k, timestamps) -> {
            if (timestamps == null) timestamps = new ConcurrentLinkedDeque<>();
            while (!timestamps.isEmpty() && timestamps.peekFirst() < now - windowMs) timestamps.pollFirst();
            if (timestamps.size() < maxEvents) { timestamps.addLast(now); allowed.set(true); }
            return timestamps;
        });
        return allowed.get();
    }

    /** Remaining capacity for a key (for X-RateLimit-Remaining header). */
    public int remaining(String key, int maxEvents, long windowMs) {
        if (shared) return sharedStore.remaining(key, maxEvents);
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
        for (String key : buckets.keySet()) {
            buckets.computeIfPresent(key, (k, d) -> {
                while (!d.isEmpty() && d.peekFirst() < cutoff) d.pollFirst();
                return d.isEmpty() ? null : d;
            });
        }
    }
}
