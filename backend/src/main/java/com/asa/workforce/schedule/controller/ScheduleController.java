package com.asa.workforce.schedule.controller;

import com.asa.workforce.common.dto.ApiResponse;
import com.asa.workforce.schedule.dto.CreateScheduleRequest;
import com.asa.workforce.schedule.dto.ScheduleDto;
import com.asa.workforce.schedule.service.ScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/schedules")
@RequiredArgsConstructor
@Tag(name = "Schedules", description = "Weekly work schedules")
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping("/my")
    @Operation(summary = "Get the current week's schedule for the authenticated employee")
    public ResponseEntity<ApiResponse<ScheduleDto>> getMySchedule(
            @AuthenticationPrincipal UserDetails user) {

        return scheduleService.getCurrentSchedule(user.getUsername())
                .map(s -> ResponseEntity.ok(ApiResponse.ok(s)))
                .orElse(ResponseEntity.ok(ApiResponse.ok(null)));
    }

    @GetMapping("/my/recent")
    @Operation(summary = "Get recent schedules for the authenticated employee")
    public ResponseEntity<ApiResponse<List<ScheduleDto>>> getMyRecentSchedules(
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(ApiResponse.ok(
                scheduleService.getUpcomingSchedules(user.getUsername())));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','MAIN_MANAGER','WEEKEND_MANAGER')")
    @Operation(summary = "Create a schedule for an employee (admin/manager only)")
    public ResponseEntity<ApiResponse<ScheduleDto>> createSchedule(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody CreateScheduleRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(scheduleService.createSchedule(request, user.getUsername())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a schedule (admin/manager only)")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable UUID id) {
        scheduleService.deleteSchedule(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
