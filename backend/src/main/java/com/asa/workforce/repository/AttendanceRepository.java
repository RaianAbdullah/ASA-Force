package com.asa.workforce.repository;

import com.asa.workforce.entity.Attendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {

    Optional<Attendance> findByEmployeeIdAndAttendanceDate(UUID employeeId, LocalDate date);

    Page<Attendance> findByEmployeeIdOrderByAttendanceDateDesc(UUID employeeId, Pageable pageable);

    /** All attendance records for a specific date (admin dashboard) */
    @Query("""
        SELECT a FROM Attendance a
        JOIN FETCH a.employee e
        LEFT JOIN FETCH e.department
        WHERE a.attendanceDate = :date
        ORDER BY e.firstNameAr
    """)
    List<Attendance> findAllByDate(LocalDate date);

    /** All attendance for a specific date filtered by department */
    @Query("""
        SELECT a FROM Attendance a
        JOIN FETCH a.employee e
        WHERE a.attendanceDate = :date
          AND e.department.id = :departmentId
        ORDER BY e.firstNameAr
    """)
    List<Attendance> findAllByDateAndDepartment(LocalDate date, UUID departmentId);

    /** Count employees who have checked in today */
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.attendanceDate = :date AND a.checkInTime IS NOT NULL")
    long countCheckedInOnDate(LocalDate date);

    /** Count late check-ins today */
    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.attendanceDate = :date AND a.status = 'LATE'")
    long countLateOnDate(LocalDate date);
}
