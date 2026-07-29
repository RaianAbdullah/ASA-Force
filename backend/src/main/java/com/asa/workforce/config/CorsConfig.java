package com.asa.workforce.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS configuration.
 *
 * Development: allows all origins (controlled by app.cors.allowed-origins=* in dev profile).
 * Production: MUST set ALLOWED_CORS_ORIGINS to specific mobile app domains.
 *             Wildcard CORS is never used in production.
 *
 * Security note: CORS is a browser-level control. Mobile apps (React Native) are
 * not subject to browser CORS, but it is still good practice to restrict origins.
 */
@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:*}")
    private String allowedOriginsRaw;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        List<String> allowedOrigins = Arrays.stream(allowedOriginsRaw.split(","))
            .map(String::trim)
            .filter(origin -> !origin.isBlank())
            .toList();

        CorsConfiguration config = new CorsConfiguration();
        if (allowedOrigins.contains("*")) {
            config.setAllowedOriginPatterns(List.of("*"));
        } else {
            config.setAllowedOrigins(allowedOrigins);
        }
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of(
            "Authorization", "Content-Type", "Accept", "X-Requested-With",
            "X-Request-ID", "X-Correlation-ID"
        ));
        config.setExposedHeaders(List.of("X-Request-ID", "X-Correlation-ID"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
