package com.asa.workforce.repository;

import com.asa.workforce.entity.VacationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VacationRequestRepository extends JpaRepository<VacationRequest, UUID> {

    List<VacationRequest> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    /** All requests for a given status, oldest-first (used for pending queues) */
    List<VacationRequest> findByStatusOrderByCreatedAtAsc(VacationRequest.VacationStatus status);

    /** Stage-1 pending requests scoped to a single department */
    List<VacationRequest> findByStatusAndEmployeeDepartmentIdOrderByCreatedAtAsc(
            VacationRequest.VacationStatus status, UUID departmentId);

    /** Approved requests for an employee within a date range (used for balance calc) */
    @org.springframework.data.jpa.repository.Query(
        "SELECT v FROM VacationRequest v WHERE v.employee.id = :employeeId " +
        "AND v.status = com.asa.workforce.entity.VacationRequest.VacationStatus.APPROVED " +
        "AND v.startDate >= :from AND v.startDate <= :to")
    List<VacationRequest> findApprovedInRange(
        @org.springframework.data.repository.query.Param("employeeId") UUID employeeId,
        @org.springframework.data.repository.query.Param("from") java.time.LocalDate from,
        @org.springframework.data.repository.query.Param("to") java.time.LocalDate to);
}
