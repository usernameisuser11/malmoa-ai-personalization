package com.aac.malmoa.profile;

import com.aac.malmoa.domain.AacUserSettings;
import com.aac.malmoa.repository.AacUserSettingsRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/users/{userId}/settings")
public class UserSettingsController {
    private final AacUserSettingsRepository repository;

    public UserSettingsController(AacUserSettingsRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    @Transactional
    public Response get(@PathVariable Long userId) {
        return Response.from(findOrCreate(userId));
    }

    @PutMapping
    @Transactional
    public Response update(@PathVariable Long userId, @Valid @RequestBody Request request) {
        AacUserSettings settings = findOrCreate(userId);
        settings.update(request.name(), request.birthDate(), request.relationshipType(), request.emergencyContact(),
                request.gridSize(), request.voiceType(), request.speechRate());
        return Response.from(repository.save(settings));
    }

    private AacUserSettings findOrCreate(Long userId) {
        if (userId == null || userId < 1) throw new IllegalArgumentException("사용자 ID를 확인해주세요.");
        return repository.findById(userId).orElseGet(() -> repository.save(new AacUserSettings(userId)));
    }

    public record Request(
            @NotBlank @Size(max = 120) String name,
            LocalDate birthDate,
            @Pattern(regexp = "^(PARENT|SIBLING|TEACHER|CAREGIVER|OTHER)$") String relationshipType,
            @Size(max = 40) String emergencyContact,
            @Pattern(regexp = "^(GRID_2X2|GRID_3X3|GRID_4X4)$") String gridSize,
            @Pattern(regexp = "^(CHILD_MALE|CHILD_FEMALE)$") String voiceType,
            @DecimalMin("0.7") @DecimalMax("1.3") double speechRate) {}

    public record Response(Long userId, String name, LocalDate birthDate, String relationshipType,
                           String emergencyContact, String gridSize, String voiceType, double speechRate) {
        static Response from(AacUserSettings settings) {
            return new Response(settings.getUserId(), settings.getName(), settings.getBirthDate(), settings.getRelationshipType(),
                    settings.getEmergencyContact(), settings.getGridSize(), settings.getVoiceType(), settings.getSpeechRate());
        }
    }
}
