package com.aac.malmoa.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "aac_user_settings")
public class AacUserSettings {
    @Id
    @Column(name = "user_id")
    private Long userId;
    @Column(nullable = false)
    private String name = "사용자";
    @Column(name = "birth_date")
    private LocalDate birthDate;
    @Column(name = "relationship_type")
    private String relationshipType = "PARENT";
    @Column(name = "emergency_contact")
    private String emergencyContact;
    @Column(name = "grid_size", nullable = false)
    private String gridSize = "GRID_3X3";
    @Column(name = "voice_type", nullable = false)
    private String voiceType = "CHILD_MALE";
    @Column(name = "speech_rate", nullable = false)
    private double speechRate = 1.0;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    protected AacUserSettings() {}
    public AacUserSettings(Long userId) { this.userId = userId; }

    public Long getUserId() { return userId; }
    public String getName() { return name; }
    public LocalDate getBirthDate() { return birthDate; }
    public String getRelationshipType() { return relationshipType; }
    public String getEmergencyContact() { return emergencyContact; }
    public String getGridSize() { return gridSize; }
    public String getVoiceType() { return voiceType; }
    public double getSpeechRate() { return speechRate; }

    public void update(String name, LocalDate birthDate, String relationshipType, String emergencyContact,
                       String gridSize, String voiceType, double speechRate) {
        this.name = name == null || name.isBlank() ? "사용자" : name.trim();
        this.birthDate = birthDate;
        this.relationshipType = relationshipType == null || relationshipType.isBlank() ? "PARENT" : relationshipType;
        this.emergencyContact = emergencyContact == null || emergencyContact.isBlank() ? null : emergencyContact.trim();
        this.gridSize = gridSize == null || gridSize.isBlank() ? "GRID_3X3" : gridSize;
        this.voiceType = voiceType == null || voiceType.isBlank() ? "CHILD_MALE" : voiceType;
        this.speechRate = Math.max(0.7, Math.min(1.3, speechRate));
        this.updatedAt = LocalDateTime.now();
    }
}
