package com.asa.workforce.schedule.service;

import com.asa.workforce.audit.AuditService;
import com.asa.workforce.entity.Employee;
import com.asa.workforce.entity.ShiftSwapRequest;
import com.asa.workforce.entity.ShiftSwapRequest.SwapStatus;
import com.asa.workforce.entity.WeeklySchedule;
import com.asa.workforce.repository.EmployeeRepository;
import com.asa.workforce.repository.ShiftSwapRepository;
import com.asa.workforce.schedule.dto.CreateSwapRequest;
import com.asa.workforce.schedule.dto.SwapRequestDto;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShiftSwapService {

    private final ShiftSwapRepository   swapRepository;
    private final EmployeeRepository    employeeRepository;
    private final ScheduleService       scheduleService;
    private final AuditService          auditService;

    // ── Employee: submit a swap request ──────────────────────────────────────

    @Transactional
    public SwapRequestDto createRequest(String nationalId, CreateSwapRequest req, HttpServletRequest httpReq) {
        Employee requester = findEmployee(nationalId);
        Employee target    = employeeRepository.findById(req.getTargetEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Target employee not found"));

        if (requester.getId().equals(target.getId())) {
            throw new IllegalArgumentException("Cannot request a swap with yourself");
        }

        ShiftSwapRequest swap = ShiftSwapRequest.builder()
                .requester(requester)
                .target(target)
                .requesterWeekStart(req.getMyWeekStart())
                .targetWeekStart(req.getTheirWeekStart())
                .reason(req.getReason())
                .status(SwapStatus.PENDING)
                .build();

        swap = swapRepository.save(swap);
        auditService.log("SHIFT_SWAP_REQUEST", requester,
                Map.of("targetId", target.getId().toString(), "myWeek", req.getMyWeekStart().toString()), httpReq);
        return toDto(swap);
    }

    // ── Employee: my requests ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SwapRequestDto> getMyRequests(String nationalId) {
        Employee emp = findEmployee(nationalId);
        return swapRepository.findByParticipant(emp.getId()).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ── Admin: all pending ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SwapRequestDto> getPending() {
        return swapRepository.findByStatusOrderByCreatedAtDesc(SwapStatus.PENDING).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ── Admin: approve (swaps the schedules) ─────────────────────────────────

    @Transactional
    public SwapRequestDto approve(UUID swapId, String adminNationalId, String notes, HttpServletRequest httpReq) {
        ShiftSwapRequest swap = findSwap(swapId);
        Employee admin = findEmployee(adminNationalId);

        // Load both schedules
        WeeklySchedule schedA = scheduleService.findForEmployeeWeek(
                swap.getRequester().getId(), swap.getRequesterWeekStart());
        WeeklySchedule schedB = scheduleService.findForEmployeeWeek(
                swap.getTarget().getId(), swap.getTargetWeekStart());

        // Swap the employee assignments
        schedA.setEmployee(swap.getTarget());
        schedB.setEmployee(swap.getRequester());
        scheduleService.save(schedA);
        scheduleService.save(schedB);

        swap.setStatus(SwapStatus.APPROVED);
        swap.setReviewedBy(admin);
        swap.setReviewNotes(notes);
        swap = swapRepository.save(swap);

        auditService.log("SHIFT_SWAP_APPROVED", admin,
                Map.of("swapId", swapId.toString()), httpReq);
        return toDto(swap);
    }

    // ── Admin: reject ─────────────────────────────────────────────────────────

    @Transactional
    public SwapRequestDto reject(UUID swapId, String adminNationalId, String notes, HttpServletRequest httpReq) {
        ShiftSwapRequest swap = findSwap(swapId);
        Employee admin = findEmployee(adminNationalId);

        swap.setStatus(SwapStatus.REJECTED);
        swap.setReviewedBy(admin);
        swap.setReviewNotes(notes);
        swap = swapRepository.save(swap);

        auditService.log("SHIFT_SWAP_REJECTED", admin,
                Map.of("swapId", swapId.toString()), httpReq);
        return toDto(swap);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ShiftSwapRequest findSwap(UUID id) {
        return swapRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Swap request not found"));
    }

    private Employee findEmployee(String nationalId) {
        return employeeRepository.findByNationalId(nationalId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
    }

    private SwapRequestDto toDto(ShiftSwapRequest s) {
        return SwapRequestDto.builder()
                .id(s.getId())
                .requesterId(s.getRequester().getId().toString())
                .requesterName(s.getRequester().getFirstNameAr() + " " + s.getRequester().getLastNameAr())
                .targetId(s.getTarget().getId().toString())
                .targetName(s.getTarget().getFirstNameAr() + " " + s.getTarget().getLastNameAr())
                .requesterWeekStart(s.getRequesterWeekStart())
                .targetWeekStart(s.getTargetWeekStart())
                .reason(s.getReason())
                .status(s.getStatus().name())
                .reviewNotes(s.getReviewNotes())
                .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : null)
                .build();
    }
}
