package com.asa.workforce.security;

import com.asa.workforce.entity.Employee;
import com.asa.workforce.repository.EmployeeRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * JWT authentication filter — three layers of validation:
 *
 *   1. Cryptographic validity (signature + expiry + issuer)
 *   2. Revocation check     (jti present in token_blacklist table)
 *   3. Live account status  (employee must still be ACTIVE in the DB)
 *
 * Any failure silently clears authentication — the request continues
 * unauthenticated and Spring Security's authorization layer rejects it
 * on protected endpoints.
 *
 * Layer 3 (DB status check) ensures that a suspended or rejected employee
 * cannot continue to use a valid token issued before the status change.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String JSON_401 =
            "{\"success\":false,\"error\":{\"code\":\"TOKEN_REVOKED\"," +
            "\"message\":\"Your session has been revoked. Please log in again.\"}}";

    private final JwtService             jwtService;
    private final TokenBlacklistService  blacklistService;
    private final EmployeeRepository     employeeRepository;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest  request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain         chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        // ── Layer 1: cryptographic validity ──────────────────────────────────
        if (!jwtService.isValid(token)) {
            chain.doFilter(request, response);
            return;
        }

        try {
            Claims claims     = jwtService.parseToken(token);
            String nationalId = claims.getSubject();
            String role       = claims.get("role",       String.class);
            String employeeId = claims.get("employeeId", String.class);
            String jti        = claims.getId();

            // ── Layer 2: revocation check ─────────────────────────────────────
            if (blacklistService.isBlacklisted(jti)) {
                log.warn("[SECURITY] Revoked token used: jti={} nationalId={}",
                        jti, mask(nationalId));
                rejectRevoked(response);
                return;
            }

            // ── Layer 3: live account status ──────────────────────────────────
            Optional<Employee> empOpt = employeeRepository.findByNationalId(nationalId);
            if (empOpt.isEmpty()) {
                log.warn("[SECURITY] Token for non-existent employee: nationalId={}", mask(nationalId));
                chain.doFilter(request, response);
                return;
            }

            Employee emp = empOpt.get();
            if (emp.getStatus() != Employee.Status.ACTIVE) {
                // Auto-revoke the token so this check isn't hit again
                Instant expiry = jwtService.extractExpiry(token);
                blacklistService.revoke(jti, emp,
                        expiry != null
                            ? OffsetDateTime.ofInstant(expiry, ZoneOffset.UTC)
                            : OffsetDateTime.now().plusHours(8),
                        "ACCOUNT_" + emp.getStatus().name());
                log.warn("[SECURITY] Token rejected — account not ACTIVE: nationalId={} status={}",
                        mask(nationalId), emp.getStatus());
                rejectRevoked(response);
                return;
            }

            // ── All checks passed — set security context ──────────────────────
            // Build authorities from the live DB roles set (multi-role support).
            // Fall back to the primary 'role' column if the set is empty.
            List<SimpleGrantedAuthority> authorities = emp.getRoles().stream()
                    .map(r -> new SimpleGrantedAuthority("ROLE_" + r.name()))
                    .collect(Collectors.toList());
            if (authorities.isEmpty()) {
                authorities = List.of(new SimpleGrantedAuthority("ROLE_" + emp.getRole().name()));
            }

            // Controllers use @AuthenticationPrincipal UserDetails, so the JWT
            // authentication must expose a UserDetails principal rather than a
            // plain String. Authentication#getName() remains the national ID.
            var principal = new User(nationalId, "", authorities);
            var auth = new UsernamePasswordAuthenticationToken(principal, null, authorities);
            auth.setDetails(employeeId);
            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (Exception ex) {
            log.debug("JWT processing failed — treating as unauthenticated: {}", ex.getMessage());
        }

        chain.doFilter(request, response);
    }

    private void rejectRevoked(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(JSON_401);
    }

    private String mask(String id) {
        if (id == null || id.length() < 4) return "****";
        return "*".repeat(id.length() - 4) + id.substring(id.length() - 4);
    }
}
