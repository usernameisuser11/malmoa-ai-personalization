package com.aac.malmoa.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "guardian_notifications")
public class GuardianNotification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "aac_user_id", nullable = false)
    private Long aacUserId;
    @Column(name = "aac_user_name", nullable = false)
    private String aacUserName;
    @Column(nullable = false, columnDefinition = "text")
    private String message;
    @Column(name = "is_read", nullable = false)
    private boolean read;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected GuardianNotification() {}
    public GuardianNotification(Long aacUserId, String aacUserName, String message) {
        this.aacUserId = aacUserId;
        this.aacUserName = aacUserName;
        this.message = message;
    }
    public Long getId() { return id; }
    public Long getAacUserId() { return aacUserId; }
    public String getAacUserName() { return aacUserName; }
    public String getMessage() { return message; }
    public boolean isRead() { return read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void markRead() { this.read = true; }
}
