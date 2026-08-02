package com.asa.workforce.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private Employee sender;

    /** Text body — nullable when the message is attachment-only. */
    @Column(columnDefinition = "TEXT")
    private String body;

    /** Stored filename relative to the attachments directory. */
    @Column(name = "attachment_path", length = 500)
    private String attachmentPath;

    /** "image" or "file" */
    @Column(name = "attachment_type", length = 20)
    private String attachmentType;

    /** Original filename shown to the recipient. */
    @Column(name = "attachment_name", length = 255)
    private String attachmentName;

    @CreationTimestamp
    @Column(name = "sent_at", nullable = false, updatable = false)
    private OffsetDateTime sentAt;
}
