package com.asa.workforce.department.controller;

import com.asa.workforce.common.dto.ApiResponse;
import com.asa.workforce.department.dto.CreateDepartmentRequest;
import com.asa.workforce.department.dto.DepartmentDto;
import com.asa.workforce.department.dto.UpdateDepartmentRequest;
import com.asa.workforce.department.service.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/v1/departments")
@RequiredArgsConstructor
@Tag(name = "Departments", description = "Department management")
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    @Operation(summary = "List all active departments")
    public ResponseEntity<ApiResponse<List<DepartmentDto>>> listActive() {
        return ResponseEntity.ok(ApiResponse.ok(departmentService.listActive()));
    }

    @GetMapping("/all")
    @Operation(summary = "List all departments including inactive (admin only)")
    public ResponseEntity<ApiResponse<List<DepartmentDto>>> listAll() {
        return ResponseEntity.ok(ApiResponse.ok(departmentService.listAll()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a department by ID")
    public ResponseEntity<ApiResponse<DepartmentDto>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(departmentService.getById(id)));
    }

    @PostMapping
    @Operation(summary = "Create a department (SYSTEM_ADMIN / MAIN_MANAGER)")
    public ResponseEntity<ApiResponse<DepartmentDto>> create(
            @Valid @RequestBody CreateDepartmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(departmentService.create(request)));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update a department (SYSTEM_ADMIN / MAIN_MANAGER)")
    public ResponseEntity<ApiResponse<DepartmentDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDepartmentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(departmentService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate a department (SYSTEM_ADMIN / MAIN_MANAGER)")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        departmentService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
