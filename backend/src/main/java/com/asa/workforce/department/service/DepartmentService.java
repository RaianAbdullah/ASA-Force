package com.asa.workforce.department.service;

import com.asa.workforce.department.dto.CreateDepartmentRequest;
import com.asa.workforce.department.dto.DepartmentDto;
import com.asa.workforce.department.dto.UpdateDepartmentRequest;
import com.asa.workforce.entity.Department;
import com.asa.workforce.entity.Employee;
import com.asa.workforce.repository.DepartmentRepository;
import com.asa.workforce.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository   employeeRepository;

    // ── Read ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DepartmentDto> listActive() {
        return departmentRepository.findByIsActiveTrue().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto> listAll() {
        return departmentRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public DepartmentDto getById(UUID id) {
        return toDto(departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found")));
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'MAIN_MANAGER')")
    @Transactional
    public DepartmentDto create(CreateDepartmentRequest req) {
        if (departmentRepository.findByCode(req.getCode()).isPresent()) {
            throw new IllegalArgumentException("Department code already exists: " + req.getCode());
        }

        Employee manager = resolveManager(req.getManagerId());

        Department dept = Department.builder()
                .nameEn(req.getNameEn())
                .nameAr(req.getNameAr())
                .code(req.getCode().toUpperCase())
                .isCrossDepartment(req.isCrossDepartment())
                .isActive(true)
                .manager(manager)
                .build();

        return toDto(departmentRepository.save(dept));
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'MAIN_MANAGER')")
    @Transactional
    public DepartmentDto update(UUID id, UpdateDepartmentRequest req) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));

        if (req.getNameEn()  != null) dept.setNameEn(req.getNameEn());
        if (req.getNameAr()  != null) dept.setNameAr(req.getNameAr());
        if (req.getIsActive() != null) dept.setIsActive(req.getIsActive());
        if (req.getIsCrossDepartment() != null) dept.setIsCrossDepartment(req.getIsCrossDepartment());

        if (req.getManagerId() != null) {
            dept.setManager(req.getManagerId().isBlank() ? null : resolveManager(req.getManagerId()));
        }

        return toDto(departmentRepository.save(dept));
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'MAIN_MANAGER')")
    @Transactional
    public void deactivate(UUID id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));
        dept.setIsActive(false);
        departmentRepository.save(dept);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Employee resolveManager(String managerId) {
        if (managerId == null || managerId.isBlank()) return null;
        return employeeRepository.findById(UUID.fromString(managerId))
                .orElseThrow(() -> new IllegalArgumentException("Manager not found: " + managerId));
    }

    DepartmentDto toDto(Department d) {
        Employee mgr = d.getManager();
        int count = (d.getEmployees() == null) ? 0 : d.getEmployees().size();
        return DepartmentDto.builder()
                .id(d.getId())
                .nameEn(d.getNameEn())
                .nameAr(d.getNameAr())
                .code(d.getCode())
                .isActive(Boolean.TRUE.equals(d.getIsActive()))
                .isCrossDepartment(Boolean.TRUE.equals(d.getIsCrossDepartment()))
                .managerId(mgr != null ? mgr.getId() : null)
                .managerName(mgr != null ? mgr.getFirstNameAr() + " " + mgr.getLastNameAr() : null)
                .employeeCount(count)
                .createdAt(d.getCreatedAt())
                .build();
    }
}
