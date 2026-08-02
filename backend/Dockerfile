# ASA Workforce Backend — Multi-stage Docker build
# Stage 1: Maven build
# Stage 2: Minimal JRE runtime

# --- Build Stage ---
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Install Maven
RUN apk add --no-cache maven

# Download dependencies first (Docker layer cache optimisation).
# Only re-downloads when pom.xml changes.
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Build application
COPY src ./src
RUN mvn package -DskipTests -q

# --- Runtime Stage ---
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Security: run as non-root user
RUN addgroup -S asa && adduser -S asa -G asa

COPY --from=builder /app/target/asa-workforce-*.jar app.jar

# Security: chown to asa user
RUN chown asa:asa app.jar

USER asa

EXPOSE 8080

# JVM flags:
#   -Djava.security.egd: faster SecureRandom for token generation
#   -XX:+UseContainerSupport: correct memory limits inside Docker
ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]
