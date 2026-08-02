package com.asa.workforce.attendance.controller;

import com.asa.workforce.attendance.dto.*;
import com.asa.workforce.attendance.service.AttendanceService;
import com.asa.workforce.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance", description = "Employee check-in, check-out, and history")
@SecurityRequirement(name = "bearerAuth")
public class AttendanceController {

    private final AttendanceService attendanceService;

    /** POST /v1/attendance/check-in */
    @PostMapping("/check-in")
    @Operation(summary = "Clock in for today with GPS coordinates")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkIn(
            @Valid @RequestBody CheckInRequest req,
            Authentication auth,
            HttpServletRequest httpReq) {

        AttendanceResponse data = attendanceService.checkIn(auth.getName(), req, httpReq);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    /** POST /v1/attendance/check-out */
    @PostMapping("/check-out")
    @Operation(summary = "Clock out for today with GPS coordinates")
    public ResponseEntity<ApiResponse<AttendanceResponse>> checkOut(
            @Valid @RequestBody CheckOutRequest req,
            Authentication auth,
            HttpServletRequest httpReq) {

        AttendanceResponse data = attendanceService.checkOut(auth.getName(), req, httpReq);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    /** GET /v1/attendance/today */
    @GetMapping("/today")
    @Operation(summary = "Get today's attendance record for the authenticated employee")
    public ResponseEntity<ApiResponse<AttendanceResponse>> getToday(Authentication auth) {
        AttendanceResponse data = attendanceService.getToday(auth.getName());
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    /** GET /v1/attendance/history */
    @GetMapping("/history")
    @Operation(summary = "Paginated attendance history for the authenticated employee")
    public ResponseEntity<ApiResponse<Page<AttendanceResponse>>> getHistory(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "30") int size,
            Authentication auth) {

        Page<AttendanceResponse> data = attendanceService.getHistory(auth.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }
}
