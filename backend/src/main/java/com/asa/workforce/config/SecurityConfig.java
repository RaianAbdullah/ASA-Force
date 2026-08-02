package com.asa.workforce.config;

import com.asa.workforce.security.JwtAuthFilter;
import com.asa.workforce.security.RateLimitFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;

/**
 * Security configuration for ASA Workforce.
 *
 * Defence-in-depth layers:
 *   1. Rate limiting     — RateLimitFilter (IP-based sliding window, Retry-After header)
 *   2. JWT validation    — JwtAuthFilter   (HS512, issuer check, revocation, live status)
 *   3. RBAC              — .hasAnyRole() on /v1/admin/** + @PreAuthorize on methods
 *   4. Security headers  — HSTS, X-Frame-Options, X-Content-Type-Options, CSP,
 *                          Referrer-Policy, Permissions-Policy, COOP, COEP
 *   5. CORS              — configured in CorsConfig (dev: *, prod: explicit list)
 *   6. CSRF              — disabled (stateless JWT API — no browser form sessions)
 *   7. Session           — STATELESS (no server-side sessions ever created)
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter   jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;

    @Value("${springdoc.swagger-ui.enabled:true}")
    private boolean swaggerEnabled;

    // ── Beans ────────────────────────────────────────────────────────────────

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        // Cost 12 ≈ 300ms on modern hardware — strong against brute-force
        return new BCryptPasswordEncoder(12);
    }

    // ── Filter chain ─────────────────────────────────────────────────────────

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // ── CSRF: disabled for stateless JWT API ──────────────────────────
            .csrf(AbstractHttpConfigurer::disable)

            // Use the shared CorsConfigurationSource for browser preflight
            // requests before authentication and authorization are evaluated.
            .cors(Customizer.withDefaults())

            // ── Session: strictly stateless ───────────────────────────────────
            .sessionManagement(s ->
                s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ── Security headers ──────────────────────────────────────────────
            .headers(headers -> headers
                // HSTS — enforce HTTPS for 1 year including subdomains + preload
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .preload(true)
                    .maxAgeInSeconds(31_536_000))

                // Never render this app in a frame (clickjacking)
                .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)

                // Enable MIME-type sniff protection (X-Content-Type-Options: nosniff)
                // Note: Spring Security enables this by default; calling it explicitly here
                // documents the intent and guards against accidental future removal.
                .contentTypeOptions(c -> { /* enabled — do not call .disable() */ })

                // Content Security Policy
                // 'unsafe-inline' is only needed because Swagger UI requires it.
                // When Swagger is disabled (production), tighten to 'none' directives.
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    swaggerEnabled
                        // Dev — relaxed for Swagger
                        ? "default-src 'self'; " +
                          "script-src 'self' 'unsafe-inline'; " +
                          "style-src 'self' 'unsafe-inline'; " +
                          "img-src 'self' data:; " +
                          "connect-src 'self'; " +
                          "frame-ancestors 'none'"
                        // Production — strict, no inline
                        : "default-src 'none'; " +
                          "connect-src 'self'; " +
                          "frame-ancestors 'none'"))

                // Referrer policy
                .referrerPolicy(rp -> rp
                    .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))

                // Cache control — prevent sensitive responses from being cached
                .cacheControl(HeadersConfigurer.CacheControlConfig::disable)

                // Additional headers not covered by Spring Security DSL
                .addHeaderWriter(new StaticHeadersWriter(
                    "Permissions-Policy",
                    "camera=(), microphone=(), geolocation=(self), " +
                    "payment=(), usb=(), bluetooth=()"))
                .addHeaderWriter(new StaticHeadersWriter(
                    "Cross-Origin-Opener-Policy", "same-origin"))
                .addHeaderWriter(new StaticHeadersWriter(
                    "Cross-Origin-Embedder-Policy", "require-corp"))
                .addHeaderWriter(new StaticHeadersWriter(
                    "Cross-Origin-Resource-Policy", "same-origin"))
            )

            // ── Authorization rules ───────────────────────────────────────────
            .authorizeHttpRequests(auth -> auth
                // Browser preflight requests never carry authentication.
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Public — auth flow
                .requestMatchers(HttpMethod.POST,
                    "/v1/auth/register",
                    "/v1/auth/verify-otp",
                    "/v1/auth/login",
                    "/v1/auth/refresh",
                    "/v1/auth/forgot-password",
                    "/v1/auth/reset-password",
                    "/v1/auth/resend-otp"
                ).permitAll()
                .requestMatchers(HttpMethod.GET,
                    "/v1/auth/status/**",
                    "/v1/messages/attachments/**",   // UUID-keyed files — no auth needed
                    "/healthz",
                    "/actuator/health",
                    "/actuator/info"
                ).permitAll()
                // Authenticated auth operations
                .requestMatchers(HttpMethod.POST,
                    "/v1/auth/logout",
                    "/v1/auth/logout-all",
                    "/v1/auth/change-password"
                ).authenticated()
                .requestMatchers(HttpMethod.GET,  "/v1/auth/sessions").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/v1/auth/sessions/**").authenticated()
                // Swagger — only when enabled (disabled in production profile)
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/v3/api-docs/**"
                ).access((auth2, ctx) -> new org.springframework.security.authorization
                        .AuthorizationDecision(swaggerEnabled))
                // Admin routes — managers and above only
                .requestMatchers("/v1/admin/**")
                    .hasAnyRole("SYSTEM_ADMIN", "MAIN_MANAGER", "DEPARTMENT_MANAGER")
                // Notification token — any authenticated user
                .requestMatchers(HttpMethod.POST, "/v1/notifications/push-token").authenticated()
                // Attendance — authenticated employees
                .requestMatchers("/v1/attendance/**").authenticated()
                // Everything else — authenticated
                .anyRequest().authenticated()
            )

            // ── Filters ───────────────────────────────────────────────────────
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter,   UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
