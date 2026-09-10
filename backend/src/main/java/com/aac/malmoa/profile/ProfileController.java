package com.aac.malmoa.profile;

import com.aac.malmoa.domain.CommunicationProfile;
import com.aac.malmoa.repository.CommunicationProfileRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/{userId}/communication-profile")
public class ProfileController {
    private final CommunicationProfileRepository repository;

    public ProfileController(CommunicationProfileRepository repository) { this.repository = repository; }

    @GetMapping
    @Transactional
    public ProfileResponse get(@PathVariable Long userId) {
        return ProfileResponse.from(findOrCreate(userId));
    }

    @PutMapping
    @Transactional
    public ProfileResponse update(@PathVariable Long userId, @Valid @RequestBody ProfileRequest request) {
        CommunicationProfile profile = findOrCreate(userId);
        profile.update(request.age(), request.receptiveMaxEojeol(), request.expressiveMaxEojeol(),
                request.vocabularyLevel(), request.allowAbstractLanguage(), request.allowCausalExpression(), request.notes());
        return ProfileResponse.from(repository.save(profile));
    }

    private CommunicationProfile findOrCreate(Long userId) {
        return repository.findByUserId(userId).orElseGet(() -> repository.save(new CommunicationProfile(userId)));
    }

    public record ProfileRequest(
            @Min(1) @Max(120) Integer age,
            @NotNull @Min(1) @Max(20) Integer receptiveMaxEojeol,
            @NotNull @Min(1) @Max(20) Integer expressiveMaxEojeol,
            String vocabularyLevel,
            boolean allowAbstractLanguage,
            boolean allowCausalExpression,
            String notes) {}

    public record ProfileResponse(Long userId, Integer age, Integer receptiveMaxEojeol, Integer expressiveMaxEojeol,
                                  String vocabularyLevel, boolean allowAbstractLanguage,
                                  boolean allowCausalExpression, String notes) {
        static ProfileResponse from(CommunicationProfile p) {
            return new ProfileResponse(p.getUserId(), p.getAge(), p.getReceptiveMaxEojeol(), p.getExpressiveMaxEojeol(),
                    p.getVocabularyLevel(), p.isAllowAbstractLanguage(), p.isAllowCausalExpression(), p.getNotes());
        }
    }
}
