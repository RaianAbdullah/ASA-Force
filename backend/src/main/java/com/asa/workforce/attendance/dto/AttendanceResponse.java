package com.asa.workforce.attendance.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
public class AttendanceResponse {
    private String      id;
    private LocalDate   attendanceDate;
    private String      status;            // PRESENT | LATE | ABSENT | EXCUSED | HOLIDAY
    private OffsetDateTime checkInTime;
    private Double      checkInLatitude;
    private Double      checkInLongitude;
    private OffsetDateTime checkOutTime;
    private Double      checkOutLatitude;
    private Double      checkOutLongitude;
    private int         minutesLate;
    private boolean     geofenceOverride;
    private String      notes;
    // Shift info (from schedule, may be null if no schedule assigned)
    private String      shiftStart;        // "08:00"
    private String      shiftEnd;          // "16:00"
    // Computed helpers for mobile UI
    private boolean     canCheckIn;        // no check-in yet today
    private boolean     canCheckOut;       // checked in but not out yet
    private Long        workedMinutes;     // null if not checked out yet
}
