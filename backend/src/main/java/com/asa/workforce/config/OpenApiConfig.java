package com.asa.workforce.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger configuration.
 *
 * Security: Swagger UI is disabled in production via application-production.yml.
 * It must NEVER be publicly accessible in a production deployment.
 */
@OpenAPIDefinition(
    info = @Info(
        title = "ASA-Force API",
        description = "Secure Workforce Mobile Application System — Internal Government API. " +
                      "This documentation is for development use only.",
        version = "v1",
        contact = @Contact(name = "ASA-Force Team")
    ),
    servers = {
        @Server(url = "/api", description = "Default server")
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    bearerFormat = "JWT",
    scheme = "bearer",
    description = "Short-lived JWT access token (10-15 min). " +
                  "Obtain via POST /api/v1/auth/login"
)
@Configuration
public class OpenApiConfig {
    // Configuration is annotation-driven.
    // Additional beans can be added here in later stages.
}
