package com.asa.workforce.attendance.controller;

import com.asa.workforce.attendance.dto.AdminAttendanceSummary;
import com.asa.workforce.attendance.service.AttendanceService;
import com.asa.workforce.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

@RestController
@RequestMapping("/v1/admin/attendance")
@RequiredArgsConstructor
@Tag(name = "Admin — Attendance", description = "Attendance dashboard for managers")
@SecurityRequirement(name = "bearerAuth")
public class AdminAttendanceController {

    private final AttendanceService attendanceService;

    /**
     * GET /v1/admin/attendance/today
     * Optional ?date=YYYY-MM-DD (defaults to today) and ?departmentId=.
     */
    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','MAIN_MANAGER','DEPARTMENT_MANAGER','WEEKEND_MANAGER')")
    @Operation(summary = "Attendance summary for a given date — all employees or per department")
    public ResponseEntity<ApiResponse<AdminAttendanceSummary>> todaySummary(
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        LocalDate target = date != null ? date : LocalDate.now(ZoneOffset.UTC);
        AdminAttendanceSummary data = attendanceService.getDaySummary(target, departmentId);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
