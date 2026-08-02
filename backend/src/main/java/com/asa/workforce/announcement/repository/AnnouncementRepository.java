package com.asa.workforce.announcement.repository;

import com.asa.workforce.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, UUID> {

    /** List all announcements — pinned first, then newest first. Reply list NOT loaded. */
    @Query("""
        SELECT a FROM Announcement a
        JOIN FETCH a.createdBy
        ORDER BY a.pinned DESC, a.createdAt DESC
    """)
    List<Announcement> findAllOrdered();
}
