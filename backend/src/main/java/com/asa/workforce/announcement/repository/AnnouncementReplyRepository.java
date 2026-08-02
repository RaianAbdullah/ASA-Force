package com.asa.workforce.announcement.repository;

import com.asa.workforce.entity.AnnouncementReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnouncementReplyRepository extends JpaRepository<AnnouncementReply, UUID> {

    @Query("""
        SELECT r FROM AnnouncementReply r
        JOIN FETCH r.author
        WHERE r.announcement.id = :announcementId
        ORDER BY r.createdAt ASC
    """)
    List<AnnouncementReply> findByAnnouncementId(UUID announcementId);

    long countByAnnouncementId(UUID announcementId);
}
