package com.asa.workforce.vacation.controller;

import com.asa.workforce.common.dto.ApiResponse;
import com.asa.workforce.vacation.dto.ReviewVacationRequest;
import com.asa.workforce.vacation.dto.SubmitVacationRequest;
import com.asa.workforce.vacation.dto.VacationBalanceDto;
import com.asa.workforce.vacation.dto.VacationRequestDto;
import com.asa.workforce.vacation.service.VacationService;
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
@RequestMapping("/v1/vacations")
@RequiredArgsConstructor
@Tag(name = "Vacations", description = "Vacation request management")
public class VacationController {

    private final VacationService vacationService;

    // ── Employee endpoints ────────────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Submit a vacation request")
    public ResponseEntity<ApiResponse<VacationRequestDto>> submit(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody SubmitVacationRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(vacationService.submit(user.getUsername(), request)));
    }

    @GetMapping("/balance")
    @Operation(summary = "Get the current employee's vacation day balance for the current year")
    public ResponseEntity<ApiResponse<VacationBalanceDto>> getBalance(
            @AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(ApiResponse.ok(vacationService.getBalance(user.getUsername())));
    }

    @GetMapping("/my")
    @Operation(summary = "Get the current employee's vacation requests")
    public ResponseEntity<ApiResponse<List<VacationRequestDto>>> getMyRequests(
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ApiResponse.ok(vacationService.getMyRequests(user.getUsername())));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel a pending vacation request")
    public ResponseEntity<ApiResponse<Void>> cancel(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id) {

        vacationService.cancel(user.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ── Manager/Admin endpoints ───────────────────────────────────────────────

    @GetMapping("/pending")
    @Operation(summary = "List pending vacation requests — role-aware (dept manager sees stage 1, main manager sees stage 2)")
    public ResponseEntity<ApiResponse<List<VacationRequestDto>>> getPending(
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ApiResponse.ok(vacationService.getPending(user.getUsername())));
    }

    @GetMapping("/all")
    @Operation(summary = "List all vacation requests (manager/admin)")
    public ResponseEntity<ApiResponse<List<VacationRequestDto>>> getAll(
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ApiResponse.ok(vacationService.getAll(user.getUsername())));
    }

    @PatchMapping("/{id}/approve")
    @Operation(summary = "Approve a vacation request — dept manager advances to stage 2, main manager/admin gives final approval")
    public ResponseEntity<ApiResponse<VacationRequestDto>> approve(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id,
            @RequestBody(required = false) ReviewVacationRequest body) {

        return ResponseEntity.ok(ApiResponse.ok(
                vacationService.approve(user.getUsername(), id,
                        body != null ? body : new ReviewVacationRequest())));
    }

    @PatchMapping("/{id}/reject")
    @Operation(summary = "Reject a vacation request at any stage")
    public ResponseEntity<ApiResponse<VacationRequestDto>> reject(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable UUID id,
            @RequestBody(required = false) ReviewVacationRequest body) {

        return ResponseEntity.ok(ApiResponse.ok(
                vacationService.reject(user.getUsername(), id,
                        body != null ? body : new ReviewVacationRequest())));
    }
}
