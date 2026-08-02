package com.asa.workforce.repository;

import com.asa.workforce.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {

    Optional<Department> findByCode(String code);

    List<Department> findByIsActiveTrue();

    /** Departments whose manager has cross-department access (e.g. Weekend Duty) */
    List<Department> findByIsCrossDepartmentTrue();

    /** The department that a given employee manages */
    @Query("SELECT d FROM Department d WHERE d.manager.id = :managerId")
    Optional<Department> findByManagerId(UUID managerId);

    /** Check if a given employee is the manager of a cross-department dept */
    @Query("""
        SELECT COUNT(d) > 0 FROM Department d
        WHERE d.manager.id = :employeeId
          AND d.isCrossDepartment = true
    """)
    boolean isManagerOfCrossDepartment(UUID employeeId);
}
