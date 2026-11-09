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
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private static final int PAGE_SIZE = 50;
    private static final Set<String> ALLOWED_ATTACHMENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/pdf", "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    private static final Set<String> ALLOWED_ATTACHMENT_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "pdf", "txt", "doc", "docx", "xls", "xlsx"
    );

    private final MessageRepository  messageRepository;
    private final EmployeeRepository employeeRepository;
    private final AttachmentValidator attachmentValidator;
    private final com.asa.workforce.message.repository.MessageAttachmentRepository attachments;

    @Value("${app.attachments.dir:/tmp/asa-attachments}")
    private String attachmentDirStr;

    private Path attachmentDir;

    @PostConstruct
    void init() throws IOException {
        attachmentDir = Paths.get(attachmentDirStr).toAbsolutePath().normalize();
        Files.createDirectories(attachmentDir);
        log.info("[Messages] Attachment directory: {}", attachmentDir.toAbsolutePath());
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    /** Latest PAGE_SIZE messages, returned oldest-first for chat rendering */
    @Transactional(readOnly = true)
    public List<MessageDto> listRecent(String nationalId) {
        Employee actor = findEmployee(nationalId);
        List<Message> msgs = messageRepository.recent(actor.getId(), departmentId(actor), management(actor), org.springframework.data.domain.PageRequest.of(0, PAGE_SIZE));
        Collections.reverse(msgs);
        return msgs.stream().map(this::toDto).toList();
    }

    /** All messages sent after `after` (used for polling), oldest-first */
    @Transactional(readOnly = true)
    public List<MessageDto> listAfter(String nationalId, OffsetDateTime after) {
        Employee actor = findEmployee(nationalId);
        return messageRepository.after(actor.getId(), departmentId(actor), management(actor), after, org.springframework.data.domain.PageRequest.of(0, PAGE_SIZE)).stream()
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
        if (sender.getDepartment() == null) throw new IllegalStateException("Assign a department before using department messages");
        Message m = Message.builder()
                .sender(sender)
                .department(sender.getDepartment())
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
        if (sender.getDepartment() == null) throw new IllegalStateException("Assign a department before using department messages");

        if (bodyText != null && bodyText.length() > 2000) throw new IllegalArgumentException("Message exceeds 2000 characters");
        String storedFilename  = null;
        String attachmentType  = null;
        String attachmentName  = null;

        if (file != null && !file.isEmpty()) {
            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_ATTACHMENT_TYPES.contains(contentType.toLowerCase())) {
                throw new IllegalArgumentException("Unsupported attachment type");
            }
            // Sanitise the original filename and prepend a UUID so names never collide
            String original    = file.getOriginalFilename();
            String safeName    = (original != null ? original.replaceAll("[^a-zA-Z0-9._-]", "_") : "attachment");
            int extensionStart = safeName.lastIndexOf('.');
            String extension = extensionStart >= 0 ? safeName.substring(extensionStart + 1).toLowerCase() : "";
            if (!ALLOWED_ATTACHMENT_EXTENSIONS.contains(extension)) {
                throw new IllegalArgumentException("Unsupported attachment extension");
            }
            attachmentValidator.validate(file, extension);
            if (safeName.length() > 120) safeName = safeName.substring(safeName.length() - 120);
            storedFilename     = UUID.randomUUID() + "_" + safeName;
            Path dest          = attachmentDir.resolve(storedFilename).normalize();

            // Path-traversal guard
            if (!dest.startsWith(attachmentDir)) {
                throw new SecurityException("Invalid filename");
            }

            attachments.save(new com.asa.workforce.entity.MessageAttachment(storedFilename, file.getBytes()));

            attachmentType     = (contentType != null && contentType.startsWith("image/")) ? "image" : "file";
            attachmentName     = original != null ? original : safeName;
        }

        Message m = Message.builder()
                .sender(sender)
                .department(sender.getDepartment())
                .body(bodyText != null && !bodyText.isBlank() ? bodyText.strip() : null)
                .attachmentPath(storedFilename)
                .attachmentType(attachmentType)
                .attachmentName(attachmentName)
                .build();

        return toDto(messageRepository.save(m));
    }

    // ── Serve attachment ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public org.springframework.core.io.Resource resolveAttachment(String nationalId, String filename) {
        Employee actor = findEmployee(nationalId);
        Message message = messageRepository.findByAttachmentPath(filename)
                .orElseThrow(() -> new NoSuchElementException("Attachment not found"));
        requireVisible(actor, message);
        var stored = attachments.findById(filename);
        if (stored.isPresent()) return new org.springframework.core.io.ByteArrayResource(stored.get().getContent());
        // Backwards compatibility for pre-migration files on an existing durable volume.
        Path resolved = attachmentDir.resolve(filename).normalize();
        if (!resolved.startsWith(attachmentDir) || !Files.isRegularFile(resolved)) {
            throw new NoSuchElementException("Attachment not found");
        }
        return new org.springframework.core.io.FileSystemResource(resolved);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(String nationalId, UUID id) {
        Message m = messageRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Message not found: " + id));
        Employee requester = findEmployee(nationalId);
        requireVisible(requester, m);
        boolean isSender = m.getSender().getId().equals(requester.getId());
        boolean isAdmin  = switch (requester.getRole()) {
            case SYSTEM_ADMIN, MAIN_MANAGER, DEPARTMENT_MANAGER -> true;
            default -> false;
        };
        if (!isSender && !isAdmin) {
            throw new SecurityException("Not allowed to delete this message");
        }
        if (m.getAttachmentPath() != null) attachments.deleteById(m.getAttachmentPath());
        // Legacy disk files are retained for offline cleanup after the transaction commits.
        messageRepository.delete(m);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private UUID departmentId(Employee e) { return e.getDepartment() == null ? null : e.getDepartment().getId(); }

    private boolean management(Employee e) {
        return (e.getRole() == Employee.Role.SYSTEM_ADMIN || e.getRoles().contains(Employee.Role.SYSTEM_ADMIN)) || (e.getRole() == Employee.Role.MAIN_MANAGER || e.getRoles().contains(Employee.Role.MAIN_MANAGER));
    }

    private void requireVisible(Employee actor, Message message) {
        boolean own = actor.getId().equals(message.getSender().getId());
        boolean sameDepartment = message.getDepartment() != null
                && message.getDepartment().getId().equals(departmentId(actor));
        if (!management(actor) && !own && !sameDepartment) {
            log.warn("[ACCESS] Denied message actor={} message={}", actor.getId(), message.getId());
            throw new NoSuchElementException("Message not found");
        }
    }

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
