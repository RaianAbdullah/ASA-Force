package com.asa.workforce.announcement.service;

import com.asa.workforce.announcement.dto.*;
import com.asa.workforce.announcement.repository.AnnouncementRepository;
import com.asa.workforce.announcement.repository.AnnouncementReplyRepository;
import com.asa.workforce.entity.Announcement;
import com.asa.workforce.entity.AnnouncementReply;
import com.asa.workforce.entity.Employee;
import com.asa.workforce.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository      announcementRepository;
    private final AnnouncementReplyRepository replyRepository;
    private final EmployeeRepository          employeeRepository;

    // ── Emoji / GIF guard ────────────────────────────────────────────────────

    private static void requireNoEmoji(String text, String field) {
        boolean hasEmoji = text.codePoints().anyMatch(cp ->
            cp > 0xFFFF ||                      // supplementary planes (most emoji)
            (cp >= 0x2600 && cp <= 0x27BF) ||   // misc symbols & dingbats
            (cp >= 0xFE00 && cp <= 0xFE0F)      // variation selectors (emoji modifiers)
        );
        if (hasEmoji) {
            throw new IllegalArgumentException(
                field + " must not contain emojis or special symbols.");
        }
    }

    // ── List ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AnnouncementDto> list() {
        return announcementRepository.findAllOrdered().stream()
                .map(a -> toDto(a, replyRepository.countByAnnouncementId(a.getId()), null))
                .toList();
    }

    // ── Thread (announcement + all replies) ──────────────────────────────────

    @Transactional(readOnly = true)
    public AnnouncementDto getThread(UUID id) {
        Announcement a = find(id);
        List<ReplyDto> replies = replyRepository.findByAnnouncementId(id).stream()
                .map(this::toReplyDto)
                .toList();
        return toDto(a, replies.size(), replies);
    }

    // ── Create announcement — managers only ──────────────────────────────────

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','MAIN_MANAGER')")
    @Transactional
    public AnnouncementDto create(String nationalId, CreateAnnouncementRequest req) {
        requireNoEmoji(req.title(), "Title");
        requireNoEmoji(req.body(),  "Body");

        Employee author = findEmployee(nationalId);
        Announcement a = Announcement.builder()
                .title(req.title().strip())
                .body(req.body().strip())
                .pinned(req.pinned())
                .createdBy(author)
                .build();
        a = announcementRepository.save(a);
        return toDto(a, 0, List.of());
    }

    // ── Reply — any authenticated employee ───────────────────────────────────

    @Transactional
    public ReplyDto reply(String nationalId, UUID announcementId, CreateReplyRequest req) {
        requireNoEmoji(req.body(), "Reply");

        Employee author = findEmployee(nationalId);
        Announcement a  = find(announcementId);

        AnnouncementReply reply = AnnouncementReply.builder()
                .announcement(a)
                .author(author)
                .body(req.body().strip())
                .build();
        return toReplyDto(replyRepository.save(reply));
    }

    // ── Delete announcement — admins only ────────────────────────────────────

    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','MAIN_MANAGER')")
    @Transactional
    public void delete(UUID id) {
        announcementRepository.delete(find(id));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Announcement find(UUID id) {
        return announcementRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Announcement not found: " + id));
    }

    private Employee findEmployee(String nationalId) {
        return employeeRepository.findByNationalId(nationalId)
                .orElseThrow(() -> new NoSuchElementException("Employee not found: " + nationalId));
    }

    private AnnouncementDto toDto(Announcement a, long replyCount, List<ReplyDto> replies) {
        Employee by = a.getCreatedBy();
        return new AnnouncementDto(
            a.getId(),
            a.getTitle(),
            a.getBody(),
            a.isPinned(),
            by.getId(),
            by.getFirstNameAr() + " " + by.getLastNameAr(),
            by.getRole().name(),
            a.getCreatedAt(),
            replyCount,
            replies
        );
    }

    private ReplyDto toReplyDto(AnnouncementReply r) {
        Employee by = r.getAuthor();
        return new ReplyDto(
            r.getId(),
            by.getId(),
            by.getFirstNameAr() + " " + by.getLastNameAr(),
            by.getRole().name(),
            r.getBody(),
            r.getCreatedAt()
        );
    }
}
