package com.asa.workforce.message.repository;
import com.asa.workforce.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import java.time.OffsetDateTime;
import java.util.*;
public interface MessageRepository extends JpaRepository<Message, UUID> {
    @Query("SELECT m FROM Message m JOIN FETCH m.sender WHERE " +
           "(:management = true OR m.sender.id = :actor OR m.department.id = :department) " +
           "ORDER BY m.sentAt DESC")
    List<Message> recent(UUID actor, UUID department, boolean management, Pageable page);
    @Query("SELECT m FROM Message m JOIN FETCH m.sender WHERE m.sentAt > :after AND " +
           "(:management = true OR m.sender.id = :actor OR m.department.id = :department) " +
           "ORDER BY m.sentAt ASC")
    List<Message> after(UUID actor, UUID department, boolean management, OffsetDateTime after, Pageable page);
    Optional<Message> findByAttachmentPath(String attachmentPath);
}
