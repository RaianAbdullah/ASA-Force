package com.asa.workforce.schedule.controller;

import com.asa.workforce.common.dto.ApiResponse;
import com.asa.workforce.schedule.dto.CreateSwapRequest;
import com.asa.workforce.schedule.dto.SwapRequestDto;
import com.asa.workforce.schedule.service.ShiftSwapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/schedule/swaps")
@RequiredArgsConstructor
@Tag(name = "Shift Swaps", description = "Request and manage shift swaps between employees")
public class ShiftSwapController {

    private final ShiftSwapService swapService;

    @PostMapping
    @Operation(summary = "Submit a shift swap request")
    public ResponseEntity<ApiResponse<SwapRequestDto>> create(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody CreateSwapRequest req,
            HttpServletRequest httpReq) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(swapService.createRequest(user.getUsername(), req, httpReq)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my swap requests")
    public ResponseEntity<ApiResponse<List<SwapRequestDto>>> my(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.ok(swapService.getMyRequests(user.getUsername())));
    }

    @GetMapping("/pending")
    @Operation(summary = "Admin: get all pending swap requests")
    public ResponseEntity<ApiResponse<List<SwapRequestDto>>> pending() {
        return ResponseEntity.ok(ApiResponse.ok(swapService.getPending()));
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Admin: approve a swap request")
    public ResponseEntity<ApiResponse<SwapRequestDto>> approve(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest httpReq) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(ApiResponse.ok(swapService.approve(id, user.getUsername(), notes, httpReq)));
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "Admin: reject a swap request")
    public ResponseEntity<ApiResponse<SwapRequestDto>> reject(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest httpReq) {
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(ApiResponse.ok(swapService.reject(id, user.getUsername(), notes, httpReq)));
    }
}
