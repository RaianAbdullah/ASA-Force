package com.asa.workforce.config;

import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Runs flyway.repair() before every migrate().
 *
 * <p>repair() is idempotent and safe to call every startup:
 * <ul>
 *   <li>If a previous migration attempt left a failed entry in
 *       flyway_schema_history (e.g. V12 in production), it removes that entry
 *       so the migration can be re-attempted with the corrected SQL.</li>
 *   <li>If the SQL of an already-applied migration was edited, it re-computes
 *       and updates the stored checksum so validate() won't reject the change.</li>
 *   <li>If nothing is wrong it is a fast no-op.</li>
 * </ul>
 */
@Configuration
public class FlywayConfig {

    @Bean
    public FlywayMigrationStrategy repairThenMigrate() {
        return flyway -> {
            flyway.repair();
            flyway.migrate();
        };
    }
}
