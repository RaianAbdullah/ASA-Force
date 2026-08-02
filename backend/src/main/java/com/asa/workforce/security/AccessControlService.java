package com.asa.workforce.security;

import com.asa.workforce.entity.Employee;
import com.asa.workforce.entity.Employee.Role;
import com.asa.workforce.repository.DepartmentRepository;
import com.asa.workforce.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Centralised access-control checks used across services and controllers.
 *
 * Role hierarchy (high → low):
 *   SYSTEM_ADMIN         — unrestricted
 *   MAIN_MANAGER         — unrestricted read; can approve registrations
 *   DEPARTMENT_MANAGER   — own department only, UNLESS dept.isCrossDepartment = true
 *                          (Weekend Duty manager gets full cross-department read on leave/vacation
 *                           and can assign any employee to weekend shifts)
 *   EMPLOYEE             — self only
 *   RESPONSIBLE_OFFICER  — read-only on approved leave records assigned to them
 */
@Service
@RequiredArgsConstructor
public class AccessControlService {

    private final EmployeeRepository    employeeRepository;
    private final DepartmentRepository  departmentRepository;

    // ── Role helpers ─────────────────────────────────────────────────────────

    public boolean isSuperAdmin(Employee emp) {
        return emp.getRole() == Role.SYSTEM_ADMIN;
    }

    public boolean isManagement(Employee emp) {
        return emp.getRole() == Role.SYSTEM_ADMIN
            || emp.getRole() == Role.MAIN_MANAGER;
    }

    public boolean isAnyManager(Employee emp) {
        return emp.getRole() == Role.SYSTEM_ADMIN
            || emp.getRole() == Role.MAIN_MANAGER
            || emp.getRole() == Role.DEPARTMENT_MANAGER;
    }

    // ── Cross-department (Weekend Duty) ───────────────────────────────────────

    /**
     * Returns true if the employee is a DEPARTMENT_MANAGER of a
     * cross-department department (currently: Weekend Duty / WKD).
     * SYSTEM_ADMIN and MAIN_MANAGER always return true (they already have
     * unrestricted access).
     */
    @Transactional(readOnly = true)
    public boolean hasCrossDepartmentAccess(Employee emp) {
        if (emp.getRole() == Role.SYSTEM_ADMIN || emp.getRole() == Role.MAIN_MANAGER) {
            return true;
        }
        if (emp.getRole() != Role.DEPARTMENT_MANAGER) {
            return false;
        }
        return departmentRepository.isManagerOfCrossDepartment(emp.getId());
    }

    // ── Department-scoped access ──────────────────────────────────────────────

    /**
     * Returns true if {@code actor} can read/manage the given {@code target} employee.
     * Rules:
     *   SYSTEM_ADMIN / MAIN_MANAGER            → always true
     *   DEPARTMENT_MANAGER with cross-dept     → always true (leave/vacation read)
     *   DEPARTMENT_MANAGER without cross-dept  → only same department
     *   EMPLOYEE / RESPONSIBLE_OFFICER         → self only
     */
    @Transactional(readOnly = true)
    public boolean canAccessEmployee(Employee actor, Employee target) {
        return switch (actor.getRole()) {
            case SYSTEM_ADMIN, MAIN_MANAGER, WEEKEND_MANAGER -> true;
            case DEPARTMENT_MANAGER -> {
                if (departmentRepository.isManagerOfCrossDepartment(actor.getId())) yield true;
                // Same department only
                var actorDept  = departmentRepository.findByManagerId(actor.getId());
                var targetDept = target.getDepartment();
                yield actorDept.isPresent() && targetDept != null
                      && actorDept.get().getId().equals(targetDept.getId());
            }
            case EMPLOYEE, RESPONSIBLE_OFFICER -> actor.getId().equals(target.getId());
        };
    }

    /**
     * Convenience overload — resolves employees by national ID.
     */
    @Transactional(readOnly = true)
    public boolean canAccessEmployee(String actorNationalId, UUID targetEmployeeId) {
        var actor  = employeeRepository.findByNationalId(actorNationalId).orElse(null);
        var target = employeeRepository.findById(targetEmployeeId).orElse(null);
        if (actor == null || target == null) return false;
        return canAccessEmployee(actor, target);
    }
}
