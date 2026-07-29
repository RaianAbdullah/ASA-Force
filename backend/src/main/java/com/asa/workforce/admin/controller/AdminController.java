package com.asa.workforce.admin.controller;

import com.asa.workforce.admin.dto.AdminActionRequest;
import com.asa.workforce.admin.dto.ApproveRegistrationRequest;
import com.asa.workforce.admin.dto.CreateEmployeeRequest;
import com.asa.workforce.admin.dto.CreateEmployeeResponse;
import com.asa.workforce.admin.dto.EmployeeSummaryDto;
import com.asa.workforce.admin.dto.PendingEmployeeDto;
import com.asa.workforce.admin.dto.UpdateEmployeeRequest;
import com.asa.workforce.admin.service.AdminService;
import com.asa.workforce.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Admin-only endpoints. All routes require ROLE_ADMIN (enforced by SecurityConfig
 * at the URL level + @PreAuthorize for method-level defence-in-depth).
 */
@RestController
@RequestMapping("/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Employee registration management")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;

    // ── GET /v1/admin/registrations/pending ──────────────────────────────────

    @GetMapping("/registrations/pending")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','MAIN_MANAGER')")
    @Operation(summary = "List employees awaiting approval (PENDING_APPROVAL)")
    public ResponseEntity<ApiResponse<Page<PendingEmployeeDto>>> listPending(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth,
            HttpServletRequest request) {

        Page<PendingEmployeeDto> data =
                adminService.listPending(page, size, auth.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(data));
    }

    // ── PATCH /v1/admin/registrations/{id}/approve ───────────────────────────

    @PatchMapping("/registrations/{employeeId}/approve")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','MAIN_MANAGER')")
    @Operation(summary = "Approve a pending employee registration")
    public ResponseEntity<ApiResponse<Map<String, Object>>> approve(
            @PathVariable UUID employeeId,
            @Valid @RequestBody ApproveRegistrationRequest approvalRequest,
            Authentication auth,
            HttpServletRequest request) {

        Map<String, Object> result =
                adminService.approve(employeeId, approvalRequest, auth.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── PATCH /v1/admin/registrations/{id}/reject ────────────────────────────

    @PatchMapping("/registrations/{employeeId}/reject")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','MAIN_MANAGER')")
    @Operation(summary = "Reject a pending employee registration")
    public ResponseEntity<ApiResponse<Map<String, Object>>> reject(
            @PathVariable UUID employeeId,
            @Valid @RequestBody AdminActionRequest req,
            Authentication auth,
            HttpServletRequest request) {

        Map<String, Object> result =
                adminService.reject(employeeId, auth.getName(), req, request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── GET /v1/admin/employees ──────────────────────────────────────────────
    // Returns ALL employees with status and contact info (for admin management).

    @GetMapping("/employees")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','MAIN_MANAGER','DEPARTMENT_MANAGER','WEEKEND_MANAGER')")
    @Operation(summary = "List all employees with status and contact info (admin management)")
    public ResponseEntity<ApiResponse<List<EmployeeSummaryDto>>> listEmployees() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.listAllEmployees()));
    }

    // ── GET /v1/admin/employees/active ───────────────────────────────────────
    // Returns ACTIVE employees only — use for pickers (schedule assignment, etc.).

    @GetMapping("/employees/active")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','MAIN_MANAGER','DEPARTMENT_MANAGER','WEEKEND_MANAGER')")
    @Operation(summary = "List active employees only (for schedule/picker flows)")
    public ResponseEntity<ApiResponse<List<EmployeeSummaryDto>>> listActiveEmployees() {
        return ResponseEntity.ok(ApiResponse.ok(adminService.listActiveEmployees()));
    }

    // ── PATCH /v1/admin/employees/{employeeId} ───────────────────────────────

    @PatchMapping("/employees/{employeeId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','MAIN_MANAGER')")
    @Operation(summary = "Update an employee's details, role, or status")
    public ResponseEntity<ApiResponse<EmployeeSummaryDto>> updateEmployee(
            @PathVariable UUID employeeId,
            @RequestBody UpdateEmployeeRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.updateEmployee(employeeId, request)));
    }

    // ── POST /v1/admin/employees ─────────────────────────────────────────────

    @PostMapping("/employees")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','MAIN_MANAGER')")
    @Operation(summary = "Create an employee account directly (active, must change password on first login)")
    public ResponseEntity<ApiResponse<CreateEmployeeResponse>> createEmployee(
            @Valid @RequestBody CreateEmployeeRequest req,
            Authentication auth,
            HttpServletRequest request) {

        CreateEmployeeResponse result =
                adminService.createEmployee(req, auth.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ── DELETE /v1/admin/employees/{employeeId} ──────────────────────────────

    @DeleteMapping("/employees/{employeeId}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Operation(summary = "Permanently delete an employee account (SYSTEM_ADMIN only)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> deleteEmployee(
            @PathVariable UUID employeeId,
            Authentication auth) {

        Map<String, Object> result = adminService.deleteEmployee(employeeId, auth.getName());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
