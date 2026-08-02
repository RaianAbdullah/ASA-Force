package com.asa.workforce.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

/**
 * Sends push notifications via the Expo Push API.
 *
 * No SDK or API key needed — Expo's push service is free for expo-notifications.
 * Calls https://exp.host/--/api/v2/push/send with a JSON payload.
 *
 * All sends are async so callers are never blocked by network I/O.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PushNotificationService {

    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    private static final int    MAX_BATCH     = 100; // Expo limit per request

    private final ObjectMapper  objectMapper;
    private final HttpClient    httpClient = HttpClient.newHttpClient();

    // ── Public API ───────────────────────────────────────────────────────────

    @Async
    public void sendToTokens(List<String> tokens,
                             String title,
                             String body,
                             Map<String, Object> data) {
        if (tokens == null || tokens.isEmpty()) return;

        // Process in batches of MAX_BATCH
        for (int i = 0; i < tokens.size(); i += MAX_BATCH) {
            List<String> batch = tokens.subList(i, Math.min(i + MAX_BATCH, tokens.size()));
            sendBatch(batch, title, body, data);
        }
    }

    @Async
    public void sendToToken(String token, String title, String body, Map<String, Object> data) {
        if (token == null || token.isBlank()) return;
        sendBatch(List.of(token), title, body, data);
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    private void sendBatch(List<String> tokens, String title, String body, Map<String, Object> data) {
        try {
            List<Map<String, Object>> messages = tokens.stream()
                    .filter(t -> t != null && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken[")))
                    .map(t -> Map.<String, Object>of(
                            "to",    t,
                            "title", title,
                            "body",  body,
                            "data",  data != null ? data : Map.of(),
                            "sound", "default",
                            "priority", "high"
                    ))
                    .toList();

            if (messages.isEmpty()) {
                log.warn("[PUSH] No valid Expo tokens in batch — skipping");
                return;
            }

            String json = objectMapper.writeValueAsString(messages);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(EXPO_PUSH_URL))
                    .header("Content-Type", "application/json")
                    .header("Accept",       "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                log.info("[PUSH] Sent {} notification(s) — title='{}'", messages.size(), title);
            } else {
                log.warn("[PUSH] Expo push returned HTTP {} — body: {}",
                        response.statusCode(), response.body());
            }
        } catch (Exception ex) {
            // Never let push failures affect the calling transaction
            log.error("[PUSH] Failed to send push notification: {}", ex.getMessage(), ex);
        }
    }
}
