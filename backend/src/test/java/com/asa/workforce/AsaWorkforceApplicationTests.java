package com.asa.workforce;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Application context load test.
 *
 * Verifies that the Spring application context starts up cleanly
 * with all configured beans and no circular dependencies.
 *
 * Stage 2+: Add @Testcontainers and PostgreSQL container here.
 */
@SpringBootTest
@ActiveProfiles("test")
class AsaWorkforceApplicationTests {

    @Test
    void contextLoads() {
        // If Spring context fails to start, this test fails.
        // No assertions needed — the context load itself is the test.
    }
}
