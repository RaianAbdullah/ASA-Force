package com.asa.workforce.repository;

import com.asa.workforce.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    boolean existsByNationalId(String nationalId);
    Optional<Employee> findByNationalId(String nationalId);
    boolean existsByPhoneNumber(String phoneNumber);

    // Admin approval flow
    Page<Employee> findByStatus(Employee.Status status, Pageable pageable);

    // Push notification targeting
    @Query("SELECT e FROM Employee e WHERE e.role = :role AND e.status = 'ACTIVE'")
    List<Employee> findActiveByRole(Employee.Role role);

    // Department-scoped queries (for DEPARTMENT_MANAGER access control)
    Page<Employee> findByDepartmentId(java.util.UUID departmentId, org.springframework.data.domain.Pageable pageable);

    // Active employee list (for schedule assignment picker)
    List<Employee> findByStatusOrderByFirstNameArAsc(Employee.Status status);
}
