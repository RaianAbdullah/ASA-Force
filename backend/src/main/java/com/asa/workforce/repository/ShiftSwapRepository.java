package com.asa.workforce.repository;

import com.asa.workforce.entity.ShiftSwapRequest;
import com.asa.workforce.entity.ShiftSwapRequest.SwapStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ShiftSwapRepository extends JpaRepository<ShiftSwapRequest, UUID> {

    @Query("SELECT s FROM ShiftSwapRequest s WHERE s.requester.id = :id OR s.target.id = :id ORDER BY s.createdAt DESC")
    List<ShiftSwapRequest> findByParticipant(@Param("id") UUID employeeId);

    List<ShiftSwapRequest> findByStatusOrderByCreatedAtDesc(SwapStatus status);
}
