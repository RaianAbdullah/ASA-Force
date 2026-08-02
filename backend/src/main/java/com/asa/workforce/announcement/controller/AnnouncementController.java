package com.asa.workforce.announcement.controller;

import com.asa.workforce.announcement.dto.*;
import com.asa.workforce.announcement.service.AnnouncementService;
import com.asa.workforce.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/announcements")
@RequiredArgsConstructor
@Tag(name = "Announcements", description = "Manager announcements and employee replies")
public class AnnouncementController {

    private final AnnouncementService service;

    @GetMapping
    @Operation(summary = "List all announcements (pinned first)")
    public ResponseEntity<ApiResponse<List<AnnouncementDto>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(service.list()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single announcement with all replies")
    public ResponseEntity<ApiResponse<AnnouncementDto>> getThread(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getThread(id)));
    }

    @PostMapping
    @Operation(summary = "Post a new announcement (SYSTEM_ADMIN / MAIN_MANAGER only)")
    public ResponseEntity<ApiResponse<AnnouncementDto>> create(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody CreateAnnouncementRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.create(user.getUsername(), req)));
    }

    @PostMapping("/{id}/replies")
    @Operation(summary = "Reply to an announcement (any active employee)")
    public ResponseEntity<ApiResponse<ReplyDto>> reply(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id,
            @Valid @RequestBody CreateReplyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(service.reply(user.getUsername(), id, req)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an announcement (SYSTEM_ADMIN / MAIN_MANAGER only)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
