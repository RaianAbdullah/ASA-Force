package com.asa.workforce.repository;

import com.asa.workforce.entity.EmployeeManagementNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface EmployeeManagementNoteRepository extends JpaRepository<EmployeeManagementNote, UUID> {

    @Query("""
        SELECT n FROM EmployeeManagementNote n
        JOIN FETCH n.author
        WHERE n.employee.id = :employeeId
        ORDER BY n.createdAt DESC
    """)
    List<EmployeeManagementNote> findByEmployeeIdNewestFirst(UUID employeeId);

    long countByEmployeeId(UUID employeeId);
}

