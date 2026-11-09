package com.asa.workforce.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="message_attachments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class MessageAttachment {
 @Id @Column(length=500) private String filename;
 @Column(nullable=false, columnDefinition="bytea") private byte[] content;
}
