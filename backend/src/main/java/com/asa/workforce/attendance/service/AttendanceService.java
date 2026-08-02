package com.asa.workforce.attendance.service;

import com.asa.workforce.attendance.dto.*;
import com.asa.workforce.audit.AuditService;
import com.asa.workforce.entity.Attendance;
import com.asa.workforce.entity.Attendance.Status;
import com.asa.workforce.entity.Employee;
import com.asa.workforce.entity.WeeklySchedule;
import com.asa.workforce.repository.AttendanceRepository;
import com.asa.workforce.repository.EmployeeRepository;
import com.asa.workforce.repository.WeeklyScheduleRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService {

    /** Grace period before a check-in is counted as LATE */
    private static final int GRACE_MINUTES = 15;

    private final AttendanceRepository     attendanceRepository;
    private final EmployeeRepository       employeeRepository;
    private final WeeklyScheduleRepository scheduleRepository;
    private final GeofenceService          geofenceService;
    private final AuditService             auditService;

    @Value("${spring.profiles.active:production}")
    private String activeProfile;

    // ── Check-in ─────────────────────────────────────────────────────────────

    @Transactional
    public AttendanceResponse checkIn(String nationalId, CheckInRequest req,
                                      HttpServletRequest httpReq) {
        Employee emp = findActive(nationalId);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        // Prevent double check-in
        if (attendanceRepository.findByEmployeeIdAndAttendanceDate(emp.getId(), today).isPresent()) {
            throw new IllegalStateException("You have already checked in today.");
        }

        // Fetch schedule once — used for both the shift-window guard and LATE/PRESENT calculation
        Optional<WeeklySchedule> scheduleOpt = scheduleRepository
                .findCurrentForEmployee(emp.getId(), today, today.minusDays(7));

        // Enforce shift-start window: check-in opens 30 minutes before shift
        if (scheduleOpt.isPresent()) {
            LocalTime nowUtc   = LocalTime.now(ZoneOffset.UTC);
            LocalTime earliest = scheduleOpt.get().getShiftStart().minusMinutes(30);
            if (nowUtc.isBefore(earliest)) {
                String starts = scheduleOpt.get().getShiftStart().toString().substring(0, 5);
                throw new IllegalStateException(
                    "Check-in is not available yet. Your shift starts at " + starts +
                    ". Check-in opens 30 minutes before your shift.");
            }
        }

        // Geofence validation (bypassable in dev profile only)
        boolean bypassed = false;
        boolean devProfile = activeProfile.contains("development");
        boolean bypassRequested = Boolean.TRUE.equals(req.getBypassGeofence());

        if (!geofenceService.isInsideGeofence(req.getLatitude(), req.getLongitude())) {
            if (devProfile && bypassRequested) {
                bypassed = true;
                log.warn("[GEOFENCE] Check-in bypass used by {} — distance: {:.0f}m",
                        nationalId, geofenceService.distanceMeters(req.getLatitude(), req.getLongitude()));
            } else {
                double dist = geofenceService.distanceMeters(req.getLatitude(), req.getLongitude());
                throw new IllegalStateException(
                    String.format("You are %.0fm from the office. Check-in requires being within %.0fm.",
                        dist, geofenceService.getRadiusMeters()));
            }
        }

        // Determine PRESENT vs LATE from schedule
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        Status status = Status.PRESENT;
        short minutesLate = 0;

        if (scheduleOpt.isPresent()) {
            WeeklySchedule schedule = scheduleOpt.get();
            LocalTime deadline = schedule.getShiftStart().plusMinutes(GRACE_MINUTES);
            LocalTime nowLocal = now.atZoneSameInstant(ZoneOffset.UTC).toLocalTime();
            if (nowLocal.isAfter(deadline)) {
                status = Status.LATE;
                minutesLate = (short) ChronoUnit.MINUTES.between(schedule.getShiftStart(), nowLocal);
                minutesLate = minutesLate < 0 ? 0 : minutesLate;
            }
        }

        Attendance record = Attendance.builder()
                .employee(emp)
                .attendanceDate(today)
                .checkInTime(now)
                .checkInLatitude(BigDecimal.valueOf(req.getLatitude()))
                .checkInLongitude(BigDecimal.valueOf(req.getLongitude()))
                .status(status)
                .minutesLate(minutesLate)
                .geofenceOverride(bypassed)
                .build();

        record = attendanceRepository.save(record);

        auditService.log(AuditService.CHECK_IN, emp,
                Map.of("status", status, "lat", req.getLatitude(), "lng", req.getLongitude(),
                        "bypassed", bypassed, "minutesLate", minutesLate),
                httpReq);

        log.info("[ATTENDANCE] Check-in: {} → {} ({}min late)", nationalId, status, minutesLate);
        return toResponse(record, scheduleOpt.orElse(null));
    }

    // ── Check-out ────────────────────────────────────────────────────────────

    @Transactional
    public AttendanceResponse checkOut(String nationalId, CheckOutRequest req,
                                       HttpServletRequest httpReq) {
        Employee emp = findActive(nationalId);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        Attendance record = attendanceRepository
                .findByEmployeeIdAndAttendanceDate(emp.getId(), today)
                .orElseThrow(() -> new IllegalStateException("No check-in found for today."));

        if (record.getCheckOutTime() != null) {
            throw new IllegalStateException("You have already checked out today.");
        }

        // Geofence check for check-out (warn but don't block)
        boolean inFence = geofenceService.isInsideGeofence(req.getLatitude(), req.getLongitude());
        if (!inFence) {
            log.warn("[GEOFENCE] Check-out outside geofence by {} — {:.0f}m away",
                    nationalId, geofenceService.distanceMeters(req.getLatitude(), req.getLongitude()));
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        record.setCheckOutTime(now);
        record.setCheckOutLatitude(BigDecimal.valueOf(req.getLatitude()));
        record.setCheckOutLongitude(BigDecimal.valueOf(req.getLongitude()));
        record = attendanceRepository.save(record);

        Optional<WeeklySchedule> scheduleOpt = scheduleRepository
                .findCurrentForEmployee(emp.getId(), today, today.minusDays(7));

        auditService.log(AuditService.CHECK_OUT, emp,
                Map.of("lat", req.getLatitude(), "lng", req.getLongitude(), "inFence", inFence),
                httpReq);

        log.info("[ATTENDANCE] Check-out: {} at {}", nationalId, now);
        return toResponse(record, scheduleOpt.orElse(null));
    }

    // ── Today's record (employee self) ───────────────────────────────────────

    @Transactional(readOnly = true)
    public AttendanceResponse getToday(String nationalId) {
        Employee emp = findActive(nationalId);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        Optional<Attendance> record = attendanceRepository
                .findByEmployeeIdAndAttendanceDate(emp.getId(), today);
        Optional<WeeklySchedule> schedule = scheduleRepository
                .findCurrentForEmployee(emp.getId(), today, today.minusDays(7));

        return record
                .map(a -> toResponse(a, schedule.orElse(null)))
                .orElse(emptyTodayResponse(today, schedule.orElse(null)));
    }

    // ── History (employee self) ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AttendanceResponse> getHistory(String nationalId, int page, int size) {
        Employee emp = findActive(nationalId);
        return attendanceRepository
                .findByEmployeeIdOrderByAttendanceDateDesc(emp.getId(),
                        PageRequest.of(page, size, Sort.by("attendanceDate").descending()))
                .map(a -> toResponse(a, null));
    }

    // ── Admin: today's summary ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AdminAttendanceSummary getDaySummary(LocalDate date, UUID departmentId) {
        LocalDate today = date != null ? date : LocalDate.now(ZoneOffset.UTC);

        List<Attendance> records = departmentId != null
                ? attendanceRepository.findAllByDateAndDepartment(today, departmentId)
                : attendanceRepository.findAllByDate(today);

        // Active employee count for the scope
        long totalActive = departmentId != null
                ? employeeRepository.findByDepartmentId(departmentId,
                        PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements()
                : employeeRepository.findByStatus(Employee.Status.ACTIVE,
                        PageRequest.of(0, Integer.MAX_VALUE)).getTotalElements();

        long checkedIn = records.stream().filter(a -> a.getCheckInTime() != null).count();
        long late      = records.stream().filter(a -> a.getStatus() == Status.LATE).count();
        long excused   = records.stream().filter(a -> a.getStatus() == Status.EXCUSED).count();
        long absent    = totalActive - checkedIn - excused;

        List<AdminAttendanceSummary.EmployeeAttendanceRow> rows = records.stream()
                .map(this::toRow).collect(Collectors.toList());

        return AdminAttendanceSummary.builder()
                .date(today)
                .totalActive((int) totalActive)
                .checkedIn((int) checkedIn)
                .late((int) late)
                .absent((int) Math.max(absent, 0))
                .excused((int) excused)
                .records(rows)
                .build();
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────

    /**
     * Returns true when the current UTC time is at or past (shiftStart − 30 min).
     * If no schedule is assigned the check-in window is considered open (edge case).
     */
    private boolean isWithinCheckInWindow(WeeklySchedule schedule) {
        if (schedule == null) return true;
        LocalTime nowUtc   = LocalTime.now(ZoneOffset.UTC);
        LocalTime earliest = schedule.getShiftStart().minusMinutes(30);
        return !nowUtc.isBefore(earliest);
    }

    private AttendanceResponse toResponse(Attendance a, WeeklySchedule schedule) {
        Long workedMins = null;
        if (a.getCheckInTime() != null && a.getCheckOutTime() != null) {
            workedMins = ChronoUnit.MINUTES.between(a.getCheckInTime(), a.getCheckOutTime());
        }
        // canCheckIn requires: no check-in recorded AND shift window is open
        boolean canCheckIn = a.getCheckInTime() == null && isWithinCheckInWindow(schedule);
        return AttendanceResponse.builder()
                .id(a.getId().toString())
                .attendanceDate(a.getAttendanceDate())
                .status(a.getStatus().name())
                .checkInTime(a.getCheckInTime())
                .checkInLatitude(a.getCheckInLatitude() != null ? a.getCheckInLatitude().doubleValue() : null)
                .checkInLongitude(a.getCheckInLongitude() != null ? a.getCheckInLongitude().doubleValue() : null)
                .checkOutTime(a.getCheckOutTime())
                .checkOutLatitude(a.getCheckOutLatitude() != null ? a.getCheckOutLatitude().doubleValue() : null)
                .checkOutLongitude(a.getCheckOutLongitude() != null ? a.getCheckOutLongitude().doubleValue() : null)
                .minutesLate(a.getMinutesLate())
                .geofenceOverride(a.getGeofenceOverride())
                .notes(a.getNotes())
                .shiftStart(schedule != null ? schedule.getShiftStart().toString() : null)
                .shiftEnd(schedule != null ? schedule.getShiftEnd().toString() : null)
                .canCheckIn(canCheckIn)
                .canCheckOut(a.getCheckInTime() != null && a.getCheckOutTime() == null)
                .workedMinutes(workedMins)
                .build();
    }

    private AttendanceResponse emptyTodayResponse(LocalDate today, WeeklySchedule schedule) {
        return AttendanceResponse.builder()
                .attendanceDate(today)
                .status(Status.ABSENT.name())
                .minutesLate(0)
                .geofenceOverride(false)
                .shiftStart(schedule != null ? schedule.getShiftStart().toString() : null)
                .shiftEnd(schedule != null ? schedule.getShiftEnd().toString() : null)
                .canCheckIn(isWithinCheckInWindow(schedule))
                .canCheckOut(false)
                .build();
    }

    private AdminAttendanceSummary.EmployeeAttendanceRow toRow(Attendance a) {
        var emp  = a.getEmployee();
        var dept = emp.getDepartment();
        Long workedMins = null;
        if (a.getCheckInTime() != null && a.getCheckOutTime() != null) {
            workedMins = ChronoUnit.MINUTES.between(a.getCheckInTime(), a.getCheckOutTime());
        }
        DateTimeFormatter hhmm = DateTimeFormatter.ofPattern("HH:mm");
        return AdminAttendanceSummary.EmployeeAttendanceRow.builder()
                .id(a.getId().toString())
                .employeeId(emp.getId().toString())
                .firstNameAr(emp.getFirstNameAr())
                .lastNameAr(emp.getLastNameAr())
                .departmentNameAr(dept != null ? dept.getNameAr() : "—")
                .departmentNameEn(dept != null ? dept.getNameEn() : "—")
                .status(a.getStatus().name())
                .checkInTime(a.getCheckInTime() != null
                        ? a.getCheckInTime().atZoneSameInstant(ZoneOffset.UTC).format(hhmm) : null)
                .checkOutTime(a.getCheckOutTime() != null
                        ? a.getCheckOutTime().atZoneSameInstant(ZoneOffset.UTC).format(hhmm) : null)
                .minutesLate(a.getMinutesLate())
                .workedMinutes(workedMins)
                .build();
    }

    // ── Util ─────────────────────────────────────────────────────────────────

    private Employee findActive(String nationalId) {
        Employee emp = employeeRepository.findByNationalId(nationalId)
                .orElseThrow(() -> new IllegalArgumentException("Employee not found"));
        if (emp.getStatus() != Employee.Status.ACTIVE) {
            throw new IllegalStateException("Account is not active");
        }
        return emp;
    }
}
