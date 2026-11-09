package com.asa.workforce.config;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
/** Repair is an explicit, one-time operator action, never the startup default. */
@Configuration
public class FlywayConfig {
 @Bean public FlywayMigrationStrategy migrate(@Value("${app.migrations.repair:false}") boolean repair) {
   return flyway -> { if (repair) flyway.repair(); flyway.migrate(); };
 }
}
