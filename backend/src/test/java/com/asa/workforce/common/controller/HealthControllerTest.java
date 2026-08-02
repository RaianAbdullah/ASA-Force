package com.asa.workforce.common.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration test for the health endpoint.
 *
 * Validates that:
 * - The endpoint is accessible without authentication
 * - The response structure is correct
 * - No sensitive information is exposed
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthEndpoint_returnsOk() throws Exception {
        mockMvc.perform(get("/healthz")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.status", is("UP")))
            .andExpect(jsonPath("$.service", is("ASA-Force API")))
            .andExpect(jsonPath("$.timestamp", notNullValue()))
            // Security: ensure no sensitive fields leak
            .andExpect(jsonPath("$.password").doesNotExist())
            .andExpect(jsonPath("$.secret").doesNotExist())
            .andExpect(jsonPath("$.database").doesNotExist());
    }
}
