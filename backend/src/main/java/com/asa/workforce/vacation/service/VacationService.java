package com.asa.workforce.vacation.service;

import com.asa.workforce.entity.Employee;
import com.asa.workforce.entity.Employee.Role;
import com.asa.workforce.entity.VacationRequest;
import com.asa.workforce.entity.VacationRequest.VacationStatus;
import com.asa.workforce.notification.PushNotificationService;
import com.asa.workforce.repository.EmployeeRepository;
import com.asa.workforce.repository.PushTokenRepository;
import com.asa.workforce.repository.VacationRequestRepository;
import com.asa.workforce.vacation.dto.ReviewVacationRequest;
import com.asa.workforce.vacation.dto.SubmitVacationRequest;
import com.asa.workforce.vacation.dto.VacationBalanceDto;
import com.asa.workforce.vacation.dto.VacationRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class VacationService {

    private final VacationRequestRepository vacationRepository;
    private final EmployeeRepository        employeeRepository;
    private final PushTokenRepository       pushTokenRepository;
    private final PushNotificationService   pushNotificationService;

    // ── Employee: submit ──────────────────────────────────────────────────────

    @Transactional
    public VacationRequestDto submit(String nationalId, SubmitVacationRequest req) {
        Employee emp = findEmployee(nationalId);

        if (emp.getStatus() != Employee.Status.ACTIVE) {
            throw new IllegalStateException("Only active employees can submit vacation requests");
        }
        if (req.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Start date cannot be in the past");
        }
        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new IllegalArgumentException("End date must be on or after start date");
        }

        // Check vacation balance before saving
        int year = LocalDate.now().getYear();
        long requestedDays = req.getEndDate().toEpochDay() - req.getStartDate().toEpochDay() + 1;
        VacationBalanceDto balance = computeBalance(emp, year);
        if (requestedDays > balance.getDaysRemaining()) {
            throw new IllegalArgumentException(
                    "Insufficient vacation balance. Requested: " + requestedDays +
                    " days, Remaining: " + balance.getDaysRemaining() + " days.");
        }

        VacationRequest vr = VacationRequest.builder()
                .employee(emp)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .reason(req.getReason())
                .status(VacationStatus.PENDING_DEPT_MANAGER)
                .build();

        return toDto(vacationRepository.save(vr));
    }

    // ── Employee: view own ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VacationRequestDto> getMyRequests(String nationalId) {
        Employee emp = findEmployee(nationalId);
        return vacationRepository.findByEmployeeIdOrderByCreatedAtDesc(emp.getId())
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public void cancel(String nationalId, UUID requestId) {
        Employee emp = findEmployee(nationalId);
        VacationRequest vr = findRequest(requestId);

        if (!vr.getEmployee().getId().equals(emp.getId())) {
            throw new SecurityException("Request does not belong to this employee");
        }
        if (vr.getStatus() != VacationStatus.PENDING_DEPT_MANAGER) {
            throw new IllegalStateException(
                    "Only requests awaiting department-manager review can be cancelled");
        }
        vr.setStatus(VacationStatus.CANCELLED);
        vacationRepository.save(vr);
    }

    // ── Manager: list pending (role-aware) ────────────────────────────────────

    /**
     * Department managers see requests at stage 1 (PENDING_DEPT_MANAGER) for
     * their own department only.
     * Main managers and system admins see requests at stage 2 (PENDING_MAIN_MANAGER).
     */
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'MAIN_MANAGER', 'DEPARTMENT_MANAGER', 'WEEKEND_MANAGER')")
    @Transactional(readOnly = true)
    public List<VacationRequestDto> getPending(String reviewerNationalId) {
        Employee reviewer = findEmployee(reviewerNationalId);

        if (reviewer.getRole() == Role.DEPARTMENT_MANAGER) {
            if (reviewer.getDepartment() == null) {
                return List.of();
            }
            return vacationRepository
                    .findByStatusAndEmployeeDepartmentIdOrderByCreatedAtAsc(
                            VacationStatus.PENDING_DEPT_MANAGER,
                            reviewer.getDepartment().getId())
                    .stream().map(this::toDto).toList();
        }

        // MAIN_MANAGER / SYSTEM_ADMIN — see stage-2 queue
        return vacationRepository
                .findByStatusOrderByCreatedAtAsc(VacationStatus.PENDING_MAIN_MANAGER)
                .stream().map(this::toDto).toList();
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'MAIN_MANAGER', 'DEPARTMENT_MANAGER', 'WEEKEND_MANAGER')")
    @Transactional(readOnly = true)
    public List<VacationRequestDto> getAll(String reviewerNationalId) {
        Employee reviewer = findEmployee(reviewerNationalId);

        if (reviewer.getRole() == Role.DEPARTMENT_MANAGER) {
            if (reviewer.getDepartment() == null) return List.of();
            // Dept manager sees only their department's requests
            UUID deptId = reviewer.getDepartment().getId();
            return vacationRepository
                    .findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                    .stream()
                    .filter(vr -> vr.getEmployee().getDepartment() != null
                            && vr.getEmployee().getDepartment().getId().equals(deptId))
                    .map(this::toDto)
                    .toList();
        }

        // MAIN_MANAGER / SYSTEM_ADMIN see everything
        return vacationRepository
                .findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toDto).toList();
    }

    // ── Manager: approve (role-aware, two-stage) ──────────────────────────────

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'MAIN_MANAGER', 'DEPARTMENT_MANAGER', 'WEEKEND_MANAGER')")
    @Transactional
    public VacationRequestDto approve(String reviewerNationalId, UUID requestId, ReviewVacationRequest body) {
        Employee reviewer = findEmployee(reviewerNationalId);
        VacationRequest vr = findRequest(requestId);

        if (reviewer.getRole() == Role.DEPARTMENT_MANAGER) {
            // Stage 1: dept manager approves → advances to stage 2
            requireStatus(vr, VacationStatus.PENDING_DEPT_MANAGER);
            requireSameDepartment(reviewer, vr);

            vr.setDeptReviewedBy(reviewer);
            vr.setDeptReviewedAt(OffsetDateTime.now());
            vr.setDeptReviewNotes(body.getNotes());
            vr.setStatus(VacationStatus.PENDING_MAIN_MANAGER);

        } else {
            // Stage 2: main manager / admin / weekend manager gives final approval
            requireStatus(vr, VacationStatus.PENDING_MAIN_MANAGER);

            vr.setReviewedBy(reviewer);
            vr.setReviewedAt(OffsetDateTime.now());
            vr.setReviewNotes(body.getNotes());
            vr.setStatus(VacationStatus.APPROVED);

            // Notify all WEEKEND_MANAGERs so they can plan weekend coverage
            String empName = vr.getEmployee().getFirstNameAr() + " " + vr.getEmployee().getLastNameAr();
            List<String> tokens = pushTokenRepository.findWeekendManagerPushTokens();
            pushNotificationService.sendToTokens(
                tokens,
                "إجازة موافق عليها — Vacation Approved",
                empName + " | " + vr.getStartDate() + " → " + vr.getEndDate(),
                Map.of("type", "vacation_approved",
                       "requestId", vr.getId().toString(),
                       "employeeId", vr.getEmployee().getId().toString())
            );
        }

        return toDto(vacationRepository.save(vr));
    }

    // ── Manager: reject (role-aware, either stage) ────────────────────────────

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'MAIN_MANAGER', 'DEPARTMENT_MANAGER', 'WEEKEND_MANAGER')")
    @Transactional
    public VacationRequestDto reject(String reviewerNationalId, UUID requestId, ReviewVacationRequest body) {
        Employee reviewer = findEmployee(reviewerNationalId);
        VacationRequest vr = findRequest(requestId);

        if (reviewer.getRole() == Role.DEPARTMENT_MANAGER) {
            requireStatus(vr, VacationStatus.PENDING_DEPT_MANAGER);
            requireSameDepartment(reviewer, vr);

            vr.setDeptReviewedBy(reviewer);
            vr.setDeptReviewedAt(OffsetDateTime.now());
            vr.setDeptReviewNotes(body.getNotes());

        } else {
            requireStatus(vr, VacationStatus.PENDING_MAIN_MANAGER);

            vr.setReviewedBy(reviewer);
            vr.setReviewedAt(OffsetDateTime.now());
            vr.setReviewNotes(body.getNotes());
        }

        vr.setStatus(VacationStatus.REJECTED);
        return toDto(vacationRepository.save(vr));
    }

    // ── Vacation balance ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public VacationBalanceDto getBalance(String nationalId) {
        Employee emp = findEmployee(nationalId);
        int year = LocalDate.now().getYear();
        return computeBalance(emp, year);
    }

    private VacationBalanceDto computeBalance(Employee emp, int year) {
        LocalDate from = LocalDate.of(year, 1, 1);
        LocalDate to   = LocalDate.of(year, 12, 31);

        int daysUsed = vacationRepository.findApprovedInRange(emp.getId(), from, to)
                .stream()
                .mapToInt(v -> (int)(v.getEndDate().toEpochDay() - v.getStartDate().toEpochDay() + 1))
                .sum();

        int daysAllowed   = emp.getVacationDaysPerYear();
        int daysRemaining = Math.max(daysAllowed - daysUsed, 0);

        return VacationBalanceDto.builder()
                .year(year)
                .daysAllowed(daysAllowed)
                .daysUsed(daysUsed)
                .daysRemaining(daysRemaining)
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Employee findEmployee(String nationalId) {
        return employeeRepository.findByNationalId(nationalId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
    }

    private VacationRequest findRequest(UUID requestId) {
        return vacationRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Request not found"));
    }

    private void requireStatus(VacationRequest vr, VacationStatus expected) {
        if (vr.getStatus() != expected) {
            throw new IllegalStateException(
                    "Request is not in the expected state. Current: " + vr.getStatus()
                            + ", expected: " + expected);
        }
    }

    private void requireSameDepartment(Employee reviewer, VacationRequest vr) {
        if (reviewer.getDepartment() == null
                || vr.getEmployee().getDepartment() == null
                || !reviewer.getDepartment().getId()
                        .equals(vr.getEmployee().getDepartment().getId())) {
            throw new SecurityException(
                    "Department manager can only review requests from their own department");
        }
    }

    // ── DTO mapping ───────────────────────────────────────────────────────────

    private VacationRequestDto toDto(VacationRequest vr) {
        Employee emp      = vr.getEmployee();
        Employee deptRev  = vr.getDeptReviewedBy();
        Employee finalRev = vr.getReviewedBy();

        String deptNameAr = (emp.getDepartment() != null) ? emp.getDepartment().getNameAr() : null;
        int totalDays = (int) (vr.getEndDate().toEpochDay() - vr.getStartDate().toEpochDay() + 1);

        return VacationRequestDto.builder()
                .id(vr.getId())
                .employeeId(emp.getId())
                .employeeNameAr(emp.getFirstNameAr() + " " + emp.getLastNameAr())
                .departmentNameAr(deptNameAr)
                .startDate(vr.getStartDate())
                .endDate(vr.getEndDate())
                .totalDays(totalDays)
                .reason(vr.getReason())
                .status(vr.getStatus().name())
                // Stage 1
                .deptReviewerNameAr(deptRev != null
                        ? deptRev.getFirstNameAr() + " " + deptRev.getLastNameAr() : null)
                .deptReviewedAt(vr.getDeptReviewedAt())
                .deptReviewNotes(vr.getDeptReviewNotes())
                // Stage 2
                .reviewerNameAr(finalRev != null
                        ? finalRev.getFirstNameAr() + " " + finalRev.getLastNameAr() : null)
                .reviewedAt(vr.getReviewedAt())
                .reviewNotes(vr.getReviewNotes())
                .createdAt(vr.getCreatedAt())
                .build();
    }
}
