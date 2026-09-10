package com.aac.malmoa.profile;

import com.aac.malmoa.domain.AacUserSettings;
import com.aac.malmoa.repository.AacUserSettingsRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/users/{userId}/settings")
public class UserSettingsController {
    private final AacUserSettingsRepository repository;
    public UserSettingsController(AacUserSettingsRepository repository) { this.repository = repository; }

    @GetMapping
    @Transactional
    public Response get(@PathVariable Long userId) { return Response.from(findOrCreate(userId)); }

    @PutMapping
    @Transactional
    public Response update(@PathVariable Long userId, @Valid @RequestBody Request request) {
        AacUserSettings settings = findOrCreate(userId);
        settings.update(request.name(), request.birthDate(), request.relationshipType(), request.emergencyContact(),
                request.gridSize(), request.voiceType(), request.speechRate());
        return Response.from(repository.save(settings));
    }

    private AacUserSettings findOrCreate(Long userId) {
        return repository.findById(userId).orElseGet(() -> repository.save(new AacUserSettings(userId)));
    }

    public record Request(@NotBlank String name, LocalDate birthDate, String relationshipType, String emergencyContact,
                          String gridSize, String voiceType,
                          @DecimalMin("0.7") @DecimalMax("1.3") double speechRate) {}
    public record Response(Long userId, String name, LocalDate birthDate, String relationshipType,
                           String emergencyContact, String gridSize, String voiceType, double speechRate) {
        static Response from(AacUserSettings s) {
            return new Response(s.getUserId(), s.getName(), s.getBirthDate(), s.getRelationshipType(),
                    s.getEmergencyContact(), s.getGridSize(), s.getVoiceType(), s.getSpeechRate());
        }
    }
}
