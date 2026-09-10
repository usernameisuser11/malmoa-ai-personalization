package com.aac.malmoa.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "word_usage", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "word"}))
public class WordUsage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(nullable = false)
    private String word;
    @Column(name = "usage_count", nullable = false)
    private long usageCount = 0;
    @Column(name = "last_used_at", nullable = false)
    private LocalDateTime lastUsedAt = LocalDateTime.now();

    protected WordUsage() {}
    public WordUsage(Long userId, String word) { this.userId = userId; this.word = word; }
    public void increment() { usageCount++; lastUsedAt = LocalDateTime.now(); }
    public Long getUserId() { return userId; }
    public String getWord() { return word; }
    public long getUsageCount() { return usageCount; }
    public LocalDateTime getLastUsedAt() { return lastUsedAt; }
}
