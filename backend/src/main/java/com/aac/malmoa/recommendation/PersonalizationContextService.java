package com.aac.malmoa.recommendation;

import com.aac.malmoa.domain.CommunicationProfile;
import com.aac.malmoa.domain.UserSymbolCustomization;
import com.aac.malmoa.domain.WordUsage;
import com.aac.malmoa.repository.CommunicationProfileRepository;
import com.aac.malmoa.repository.UserSymbolCustomizationRepository;
import com.aac.malmoa.repository.WordUsageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Service
public class PersonalizationContextService {
    private static final int MAX_PROMPT_WORDS = 30;

    private final CommunicationProfileRepository profileRepository;
    private final UserSymbolCustomizationRepository customizationRepository;
    private final WordUsageRepository usageRepository;

    public PersonalizationContextService(CommunicationProfileRepository profileRepository,
                                         UserSymbolCustomizationRepository customizationRepository,
                                         WordUsageRepository usageRepository) {
        this.profileRepository = profileRepository;
        this.customizationRepository = customizationRepository;
        this.usageRepository = usageRepository;
    }

    @Transactional(readOnly = true)
    public Snapshot snapshot(Long userId) {
        CommunicationProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> new CommunicationProfile(userId));
        List<UserSymbolCustomization> customizations = customizationRepository.findByUserId(userId);
        List<WordUsage> usage = usageRepository.findTop20ByUserIdOrderByUsageCountDescLastUsedAtDesc(userId);

        LinkedHashSet<String> favoriteWords = new LinkedHashSet<>();
        LinkedHashSet<String> importantWords = new LinkedHashSet<>();
        LinkedHashSet<String> promptWords = new LinkedHashSet<>();

        for (UserSymbolCustomization customization : customizations) {
            if (!customization.isFavorite() && !customization.isImportantWord()) continue;

            String label = preferredLabel(customization);
            if (customization.isFavorite() && label != null) favoriteWords.add(label);
            if (customization.isImportantWord() && label != null) importantWords.add(label);

            addIfPresent(promptWords, customization.getUserAlias());
            addIfPresent(promptWords, customization.getDisplayText());
            addIfPresent(promptWords, customization.getSymbol().getCanonicalText());
        }

        List<FrequentWord> frequentWords = new ArrayList<>();
        for (WordUsage item : usage) {
            frequentWords.add(new FrequentWord(item.getWord(), item.getUsageCount()));
            addIfPresent(promptWords, item.getWord());
        }

        return new Snapshot(
                userId,
                ProfileSummary.from(profile),
                List.copyOf(favoriteWords),
                List.copyOf(importantWords),
                List.copyOf(frequentWords),
                promptWords.stream().limit(MAX_PROMPT_WORDS).toList()
        );
    }

    private String preferredLabel(UserSymbolCustomization customization) {
        if (hasText(customization.getUserAlias())) return customization.getUserAlias().trim();
        if (hasText(customization.getDisplayText())) return customization.getDisplayText().trim();
        return customization.getSymbol() == null ? null : customization.getSymbol().getCanonicalText();
    }

    private void addIfPresent(LinkedHashSet<String> words, String value) {
        if (hasText(value)) words.add(value.trim());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public record FrequentWord(String word, long usageCount) {}

    public record ProfileSummary(Integer age,
                                 Integer receptiveMaxEojeol,
                                 Integer expressiveMaxEojeol,
                                 String vocabularyLevel,
                                 boolean allowAbstractLanguage,
                                 boolean allowCausalExpression,
                                 String notes) {
        static ProfileSummary from(CommunicationProfile profile) {
            return new ProfileSummary(
                    profile.getAge(),
                    profile.getReceptiveMaxEojeol(),
                    profile.getExpressiveMaxEojeol(),
                    profile.getVocabularyLevel(),
                    profile.isAllowAbstractLanguage(),
                    profile.isAllowCausalExpression(),
                    profile.getNotes()
            );
        }
    }

    public record Snapshot(Long userId,
                           ProfileSummary profile,
                           List<String> favoriteWords,
                           List<String> importantWords,
                           List<FrequentWord> frequentWords,
                           List<String> promptWords) {}
}
