package com.asa.workforce.message.controller;

import com.asa.workforce.common.dto.ApiResponse;
import com.asa.workforce.message.dto.CreateMessageRequest;
import com.asa.workforce.message.dto.MessageDto;
import com.asa.workforce.message.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/messages")
@RequiredArgsConstructor
@Tag(name = "Messages", description = "Group chat — any active employee can send and receive")
public class MessageController {

    private final MessageService service;

    // ── GET /v1/messages ─────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Get recent messages (up to 50), or messages after ?after=<ISO timestamp>")
    public ResponseEntity<ApiResponse<List<MessageDto>>> list(
            @RequestParam(required = false) OffsetDateTime after) {
        List<MessageDto> msgs = after != null
                ? service.listAfter(after)
                : service.listRecent();
        return ResponseEntity.ok(ApiResponse.ok(msgs));
    }

    // ── POST /v1/messages  (text-only, JSON) ─────────────────────────────────

    @PostMapping
    @Operation(summary = "Send a text message (any active employee)")
    public ResponseEntity<ApiResponse<MessageDto>> send(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody CreateMessageRequest req) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.send(user.getUsername(), req)));
    }

    // ── POST /v1/messages/upload  (multipart — text + file) ──────────────────

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Send a message with an attachment (image or file)")
    public ResponseEntity<ApiResponse<MessageDto>> sendWithAttachment(
            @AuthenticationPrincipal UserDetails user,
            @RequestPart(value = "body", required = false) String body,
            @RequestPart(value = "file") MultipartFile file) throws IOException {
        MessageDto dto = service.sendWithAttachment(user.getUsername(), body, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(dto));
    }

    // ── GET /v1/messages/attachments/{filename}  (public — UUID-keyed) ────────

    @GetMapping("/attachments/{filename:.+}")
    @Operation(summary = "Serve a message attachment (public — filenames are UUIDs)")
    public ResponseEntity<Resource> serveAttachment(@PathVariable String filename) throws IOException {
        Path file = service.resolveAttachment(filename);
        if (!Files.exists(file)) return ResponseEntity.notFound().build();

        String contentType;
        try { contentType = Files.probeContentType(file); }
        catch (IOException ex) { contentType = null; }
        if (contentType == null) contentType = "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                .body(new FileSystemResource(file));
    }

    // ── DELETE /v1/messages/{id} ──────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a message (sender or admin/manager)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id) {
        service.delete(user.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
