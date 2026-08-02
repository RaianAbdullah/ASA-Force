package com.asa.workforce.message.service;

import com.asa.workforce.entity.Employee;
import com.asa.workforce.entity.Message;
import com.asa.workforce.message.dto.CreateMessageRequest;
import com.asa.workforce.message.dto.MessageDto;
import com.asa.workforce.message.repository.MessageRepository;
import com.asa.workforce.repository.EmployeeRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private static final int PAGE_SIZE = 50;

    private final MessageRepository  messageRepository;
    private final EmployeeRepository employeeRepository;

    @Value("${app.attachments.dir:/tmp/asa-attachments}")
    private String attachmentDirStr;

    private Path attachmentDir;

    @PostConstruct
    void init() throws IOException {
        attachmentDir = Paths.get(attachmentDirStr);
        Files.createDirectories(attachmentDir);
        log.info("[Messages] Attachment directory: {}", attachmentDir.toAbsolutePath());
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    /** Latest PAGE_SIZE messages, returned oldest-first for chat rendering */
    @Transactional(readOnly = true)
    public List<MessageDto> listRecent() {
        List<Message> msgs = messageRepository.findRecentMessages(PAGE_SIZE);
        Collections.reverse(msgs);
        return msgs.stream().map(this::toDto).toList();
    }

    /** All messages sent after `after` (used for polling), oldest-first */
    @Transactional(readOnly = true)
    public List<MessageDto> listAfter(OffsetDateTime after) {
        return messageRepository.findAfter(after).stream()
                .map(this::toDto).toList();
    }

    // ── Send (text-only) ──────────────────────────────────────────────────────

    @Transactional
    public MessageDto send(String nationalId, CreateMessageRequest req) {
        String body = req.body() == null ? null : req.body().strip();
        if (body == null || body.isBlank()) {
            throw new IllegalArgumentException("Message body is required");
        }
        Employee sender = findEmployee(nationalId);
        Message m = Message.builder()
                .sender(sender)
                .body(body)
                .build();
        return toDto(messageRepository.save(m));
    }

    // ── Send with attachment ──────────────────────────────────────────────────

    @Transactional
    public MessageDto sendWithAttachment(String nationalId, String bodyText, MultipartFile file)
            throws IOException {
        if ((bodyText == null || bodyText.isBlank()) && (file == null || file.isEmpty())) {
            throw new IllegalArgumentException("Message must have text or an attachment");
        }

        Employee sender = findEmployee(nationalId);

        String storedFilename  = null;
        String attachmentType  = null;
        String attachmentName  = null;

        if (file != null && !file.isEmpty()) {
            // Sanitise the original filename and prepend a UUID so names never collide
            String original    = file.getOriginalFilename();
            String safeName    = (original != null ? original.replaceAll("[^a-zA-Z0-9._-]", "_") : "attachment");
            storedFilename     = UUID.randomUUID() + "_" + safeName;
            Path dest          = attachmentDir.resolve(storedFilename).normalize();

            // Path-traversal guard
            if (!dest.startsWith(attachmentDir)) {
                throw new SecurityException("Invalid filename");
            }

            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

            String contentType = file.getContentType();
            attachmentType     = (contentType != null && contentType.startsWith("image/")) ? "image" : "file";
            attachmentName     = original != null ? original : safeName;
        }

        Message m = Message.builder()
                .sender(sender)
                .body(bodyText != null && !bodyText.isBlank() ? bodyText.strip() : null)
                .attachmentPath(storedFilename)
                .attachmentType(attachmentType)
                .attachmentName(attachmentName)
                .build();

        return toDto(messageRepository.save(m));
    }

    // ── Serve attachment ──────────────────────────────────────────────────────

    public Path resolveAttachment(String filename) {
        Path resolved = attachmentDir.resolve(filename).normalize();
        if (!resolved.startsWith(attachmentDir)) {
            throw new SecurityException("Invalid attachment path");
        }
        return resolved;
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(String nationalId, UUID id) {
        Message m = messageRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Message not found: " + id));
        Employee requester = findEmployee(nationalId);
        boolean isSender = m.getSender().getId().equals(requester.getId());
        boolean isAdmin  = switch (requester.getRole()) {
            case SYSTEM_ADMIN, MAIN_MANAGER, DEPARTMENT_MANAGER -> true;
            default -> false;
        };
        if (!isSender && !isAdmin) {
            throw new SecurityException("Not allowed to delete this message");
        }
        // Also delete the physical file if present
        if (m.getAttachmentPath() != null) {
            try {
                Files.deleteIfExists(attachmentDir.resolve(m.getAttachmentPath()));
            } catch (IOException ex) {
                log.warn("[Messages] Could not delete attachment file: {}", m.getAttachmentPath(), ex);
            }
        }
        messageRepository.delete(m);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Employee findEmployee(String nationalId) {
        return employeeRepository.findByNationalId(nationalId)
                .orElseThrow(() -> new NoSuchElementException("Employee not found: " + nationalId));
    }

    private MessageDto toDto(Message m) {
        Employee s = m.getSender();
        String attachmentUrl = m.getAttachmentPath() != null
                ? "/v1/messages/attachments/" + m.getAttachmentPath()
                : null;
        return new MessageDto(
            m.getId(),
            s.getId(),
            s.getFirstNameAr() + " " + s.getLastNameAr(),
            s.getRole().name(),
            m.getBody(),
            attachmentUrl,
            m.getAttachmentType(),
            m.getAttachmentName(),
            m.getSentAt()
        );
    }
}
