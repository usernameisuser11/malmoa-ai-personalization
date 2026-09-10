package com.aac.malmoa.notification;

import com.aac.malmoa.domain.GuardianNotification;
import com.aac.malmoa.repository.GuardianNotificationRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/notifications")
public class NotificationController {
    private final GuardianNotificationRepository repository;
    public NotificationController(GuardianNotificationRepository repository) { this.repository = repository; }

    @GetMapping
    @Transactional(readOnly = true)
    public List<Response> list(@PathVariable Long userId) {
        return repository.findTop50ByAacUserIdOrderByCreatedAtDesc(userId).stream().map(Response::from).toList();
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public Response read(@PathVariable Long userId, @PathVariable Long id) {
        GuardianNotification n = repository.findById(id).orElseThrow();
        if (!n.getAacUserId().equals(userId)) throw new java.util.NoSuchElementException();
        n.markRead();
        return Response.from(repository.save(n));
    }

    public record Response(Long id, Long aacUserId, String aacUserName, String message, boolean read, LocalDateTime createdAt) {
        static Response from(GuardianNotification n) {
            return new Response(n.getId(), n.getAacUserId(), n.getAacUserName(), n.getMessage(), n.isRead(), n.getCreatedAt());
        }
    }
}
