package com.aac.malmoa.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recommendation_history")
public class RecommendationHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    private String situation;
    @Column(name = "source_intent", columnDefinition = "text")
    private String sourceIntent;
    @Column(name = "generated_sentence", nullable = false, columnDefinition = "text")
    private String generatedSentence;
    @Column(name = "eojeol_count", nullable = false)
    private int eojeolCount;
    @Column(name = "personal_word_count", nullable = false)
    private int personalWordCount;
    @Column(nullable = false)
    private boolean selected;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    protected RecommendationHistory() {}
    public RecommendationHistory(Long userId, String situation, String sourceIntent, String generatedSentence,
                                 int eojeolCount, int personalWordCount) {
        this.userId = userId;
        this.situation = situation;
        this.sourceIntent = sourceIntent;
        this.generatedSentence = generatedSentence;
        this.eojeolCount = eojeolCount;
        this.personalWordCount = personalWordCount;
    }
    public Long getId() { return id; }
    public void markSelected() { this.selected = true; }
}
