package com.asa.workforce.repository;

import com.asa.workforce.entity.WeeklySchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WeeklyScheduleRepository extends JpaRepository<WeeklySchedule, UUID> {

    /**
     * Finds the schedule that covers a given date.
     * week_start is the Monday of the week; a schedule covers 7 days from that point.
     */
    @Query("""
        SELECT s FROM WeeklySchedule s
        WHERE s.employee.id = :employeeId
          AND s.weekStart <= :date
          AND s.weekStart > :weekAgo
        ORDER BY s.weekStart DESC
    """)
    Optional<WeeklySchedule> findCurrentForEmployee(UUID employeeId, LocalDate date, LocalDate weekAgo);

    Optional<WeeklySchedule> findByEmployeeIdAndWeekStart(UUID employeeId, LocalDate weekStart);
}
