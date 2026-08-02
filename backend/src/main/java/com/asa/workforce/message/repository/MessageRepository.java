package com.asa.workforce.message.repository;

import com.asa.workforce.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    /** Most recent N messages, newest last (for chat display) */
    @Query("""
        SELECT m FROM Message m
        JOIN FETCH m.sender
        ORDER BY m.sentAt DESC
        LIMIT :limit
        """)
    List<Message> findRecentMessages(@Param("limit") int limit);

    /** Messages newer than a given timestamp (for polling) */
    @Query("""
        SELECT m FROM Message m
        JOIN FETCH m.sender
        WHERE m.sentAt > :after
        ORDER BY m.sentAt ASC
        """)
    List<Message> findAfter(@Param("after") OffsetDateTime after);
}
