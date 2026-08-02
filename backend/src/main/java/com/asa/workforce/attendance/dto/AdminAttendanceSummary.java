package com.asa.workforce.attendance.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class AdminAttendanceSummary {

    private LocalDate date;
    private int totalActive;      // all ACTIVE employees
    private int checkedIn;        // have a check-in today (PRESENT + LATE)
    private int late;             // status = LATE
    private int absent;           // ACTIVE with no attendance record
    private int excused;          // status = EXCUSED

    private List<EmployeeAttendanceRow> records;

    @Data
    @Builder
    public static class EmployeeAttendanceRow {
        private String id;
        private String employeeId;
        private String firstNameAr;
        private String lastNameAr;
        private String departmentNameAr;
        private String departmentNameEn;
        private String status;
        private String checkInTime;   // HH:mm or null
        private String checkOutTime;  // HH:mm or null
        private int    minutesLate;
        private Long   workedMinutes;
    }
}
