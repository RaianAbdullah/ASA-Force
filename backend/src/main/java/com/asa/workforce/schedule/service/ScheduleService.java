package com.asa.workforce.schedule.service;

import com.asa.workforce.entity.Employee;
import com.asa.workforce.entity.WeeklySchedule;
import com.asa.workforce.repository.EmployeeRepository;
import com.asa.workforce.repository.WeeklyScheduleRepository;
import com.asa.workforce.schedule.dto.CreateScheduleRequest;
import com.asa.workforce.schedule.dto.ScheduleDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private final WeeklyScheduleRepository scheduleRepository;
    private final EmployeeRepository       employeeRepository;

    /** Used by ShiftSwapService to locate a specific week's schedule. */
    @Transactional(readOnly = true)
    public WeeklySchedule findForEmployeeWeek(UUID employeeId, LocalDate weekStart) {
        return scheduleRepository.findByEmployeeIdAndWeekStart(employeeId, weekStart)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No schedule found for employee " + employeeId + " week " + weekStart));
    }

    /** Used by ShiftSwapService to persist swapped schedules. */
    @Transactional
    public WeeklySchedule save(WeeklySchedule schedule) {
        return scheduleRepository.save(schedule);
    }

    // ── Employee: get their current schedule ─────────────────────────────────

    @Transactional(readOnly = true)
    public Optional<ScheduleDto> getCurrentSchedule(String nationalId) {
        Employee emp = employeeRepository.findByNationalId(nationalId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        LocalDate today    = LocalDate.now();
        LocalDate weekAgo  = today.minusDays(7);

        return scheduleRepository
                .findCurrentForEmployee(emp.getId(), today, weekAgo)
                .map(s -> toDto(s, today));
    }

    @Transactional(readOnly = true)
    public List<ScheduleDto> getUpcomingSchedules(String nationalId) {
        Employee emp = employeeRepository.findByNationalId(nationalId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));

        LocalDate today = LocalDate.now();
        // Show schedules from 2 weeks ago up to current
        return scheduleRepository.findAll().stream()
                .filter(s -> s.getEmployee().getId().equals(emp.getId()))
                .filter(s -> !s.getWeekStart().isBefore(today.minusWeeks(2)))
                .sorted((a, b) -> b.getWeekStart().compareTo(a.getWeekStart()))
                .limit(8)
                .map(s -> toDto(s, today))
                .toList();
    }

    // ── Admin: create/update schedules ────────────────────────────────────────

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'MAIN_MANAGER', 'DEPARTMENT_MANAGER')")
    @Transactional
    public ScheduleDto createSchedule(CreateScheduleRequest req, String creatorNationalId) {
        Employee emp = employeeRepository.findById(req.getEmployeeId())
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        Employee creator = employeeRepository.findByNationalId(creatorNationalId)
                .orElseThrow(() -> new IllegalArgumentException("Creator not found"));

        // weekStart must be a Sunday (Saudi work-week starts Sunday) or Monday
        WeeklySchedule schedule = WeeklySchedule.builder()
                .employee(emp)
                .weekStart(req.getWeekStart())
                .workDays(req.getWorkDays().toUpperCase())
                .shiftStart(req.getShiftStart())
                .shiftEnd(req.getShiftEnd())
                .isWeekendDuty(req.isWeekendDuty())
                .notes(req.getNotes())
                .createdBy(creator)
                .build();

        return toDto(scheduleRepository.save(schedule), LocalDate.now());
    }

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'MAIN_MANAGER', 'DEPARTMENT_MANAGER')")
    @Transactional
    public void deleteSchedule(UUID scheduleId) {
        scheduleRepository.deleteById(scheduleId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ScheduleDto toDto(WeeklySchedule s, LocalDate refDate) {
        boolean todayIsWorkDay = s.parsedWorkDays().contains(refDate.getDayOfWeek());
        return ScheduleDto.builder()
                .id(s.getId())
                .weekStart(s.getWeekStart())
                .workDays(s.getWorkDays())
                .shiftStart(s.getShiftStart())
                .shiftEnd(s.getShiftEnd())
                .isWeekendDuty(Boolean.TRUE.equals(s.getIsWeekendDuty()))
                .notes(s.getNotes())
                .todayIsWorkDay(todayIsWorkDay)
                .build();
    }
}
