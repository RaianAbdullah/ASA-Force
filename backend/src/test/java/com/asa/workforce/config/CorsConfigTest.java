package com.asa.workforce.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.assertj.core.api.Assertions.assertThat;

class CorsConfigTest {

    @Test
    void registrationPathUsesProductionCorsPolicy() {
        CorsConfig configFactory = new CorsConfig();
        ReflectionTestUtils.setField(
            configFactory,
            "allowedOriginsRaw",
            " https://asa-force.com, https://www.asa-force.com "
        );

        CorsConfigurationSource source = configFactory.corsConfigurationSource();
        MockHttpServletRequest request =
            new MockHttpServletRequest("OPTIONS", "/v1/auth/register");
        CorsConfiguration config = source.getCorsConfiguration(request);

        assertThat(config).isNotNull();
        assertThat(config.getAllowedOrigins())
            .containsExactly("https://asa-force.com", "https://www.asa-force.com");
        assertThat(config.getAllowedMethods()).contains("POST", "OPTIONS");
        assertThat(config.getAllowedHeaders()).contains("Content-Type");
        assertThat(config.getAllowCredentials()).isTrue();
    }
}
