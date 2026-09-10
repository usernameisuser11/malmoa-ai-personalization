package com.aac.malmoa.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "communication_profiles", uniqueConstraints = @UniqueConstraint(columnNames = "user_id"))
public class CommunicationProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    private Integer age;
    @Column(name = "receptive_max_eojeol", nullable = false)
    private Integer receptiveMaxEojeol = 4;
    @Column(name = "expressive_max_eojeol", nullable = false)
    private Integer expressiveMaxEojeol = 4;
    @Column(name = "vocabulary_level", nullable = false)
    private String vocabularyLevel = "EASY";
    @Column(name = "allow_abstract_language", nullable = false)
    private boolean allowAbstractLanguage = false;
    @Column(name = "allow_causal_expression", nullable = false)
    private boolean allowCausalExpression = false;
    @Column(columnDefinition = "text")
    private String notes;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    protected CommunicationProfile() {}
    public CommunicationProfile(Long userId) { this.userId = userId; }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Integer getAge() { return age; }
    public Integer getReceptiveMaxEojeol() { return receptiveMaxEojeol; }
    public Integer getExpressiveMaxEojeol() { return expressiveMaxEojeol; }
    public String getVocabularyLevel() { return vocabularyLevel; }
    public boolean isAllowAbstractLanguage() { return allowAbstractLanguage; }
    public boolean isAllowCausalExpression() { return allowCausalExpression; }
    public String getNotes() { return notes; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void update(Integer age, Integer receptiveMaxEojeol, Integer expressiveMaxEojeol,
                       String vocabularyLevel, boolean allowAbstractLanguage,
                       boolean allowCausalExpression, String notes) {
        this.age = age;
        this.receptiveMaxEojeol = Math.max(1, receptiveMaxEojeol);
        this.expressiveMaxEojeol = Math.max(1, expressiveMaxEojeol);
        this.vocabularyLevel = vocabularyLevel == null ? "EASY" : vocabularyLevel;
        this.allowAbstractLanguage = allowAbstractLanguage;
        this.allowCausalExpression = allowCausalExpression;
        this.notes = notes;
        this.updatedAt = LocalDateTime.now();
    }
}
