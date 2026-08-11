package com.asa.workforce.admin.service;

import com.asa.workforce.admin.dto.CreateEmployeeNoteRequest;
import com.asa.workforce.admin.dto.EmployeeNoteDto;
import com.asa.workforce.audit.AuditService;
import com.asa.workforce.entity.Employee;
import com.asa.workforce.entity.EmployeeManagementNote;
import com.asa.workforce.repository.EmployeeManagementNoteRepository;
import com.asa.workforce.repository.EmployeeRepository;
import com.asa.workforce.security.AccessControlService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmployeeNoteService {

    private final EmployeeManagementNoteRepository noteRepository;
    private final EmployeeRepository employeeRepository;
    private final AccessControlService accessControlService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('DEPARTMENT_MANAGER','EMPLOYEE')")
    public List<EmployeeNoteDto> list(UUID employeeId, String actorNationalId) {
        Employee actor = requireEmployeeByNationalId(actorNationalId, "Manager not found");
        Employee target = requireEmployee(employeeId);
        requireViewAccess(actor, target);
        return noteRepository.findByEmployeeIdNewestFirst(employeeId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    @PreAuthorize("hasRole('DEPARTMENT_MANAGER')")
    public EmployeeNoteDto create(UUID employeeId,
                                  CreateEmployeeNoteRequest request,
                                  String actorNationalId,
                                  HttpServletRequest httpRequest) {
        Employee actor = requireEmployeeByNationalId(actorNationalId, "Manager not found");
        Employee target = requireEmployee(employeeId);
        requireDepartmentManagerAccess(actor, target);

        EmployeeManagementNote.Category category;
        try {
            category = EmployeeManagementNote.Category.valueOf(request.getCategory());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid note category");
        }

        EmployeeManagementNote saved = noteRepository.save(EmployeeManagementNote.builder()
                .employee(target)
                .author(actor)
                .category(category)
                .note(request.getNote().trim())
                .build());

        auditService.log("EMPLOYEE_MANAGEMENT_NOTE_CREATED", actor, "EMPLOYEE", target.getId(),
                Map.of("category", category.name()), httpRequest);
        return toDto(saved);
    }

    private void requireViewAccess(Employee actor, Employee target) {
        if (actor.getRole() == Employee.Role.EMPLOYEE && actor.getId().equals(target.getId())) return;
        requireDepartmentManagerAccess(actor, target);
    }

    private void requireDepartmentManagerAccess(Employee actor, Employee target) {
        if (actor.getRole() != Employee.Role.DEPARTMENT_MANAGER
                || !accessControlService.canAccessEmployee(actor, target)) {
            throw new SecurityException("Only the employee's department manager can access this record");
        }
    }

    private Employee requireEmployee(UUID id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
    }

    private Employee requireEmployeeByNationalId(String nationalId, String message) {
        return employeeRepository.findByNationalId(nationalId)
                .orElseThrow(() -> new IllegalArgumentException(message));
    }

    private EmployeeNoteDto toDto(EmployeeManagementNote note) {
        Employee author = note.getAuthor();
        return EmployeeNoteDto.builder()
                .id(note.getId())
                .employeeId(note.getEmployee().getId())
                .category(note.getCategory().name())
                .note(note.getNote())
                .authorId(author.getId())
                .authorNameAr(fullNameAr(author))
                .authorRole(author.getRole().name())
                .createdAt(note.getCreatedAt())
                .build();
    }

    private String fullNameAr(Employee employee) {
        String middle = employee.getMiddleNameAr();
        return middle == null || middle.isBlank()
                ? employee.getFirstNameAr() + " " + employee.getLastNameAr()
                : employee.getFirstNameAr() + " " + middle.trim() + " " + employee.getLastNameAr();
    }
}
