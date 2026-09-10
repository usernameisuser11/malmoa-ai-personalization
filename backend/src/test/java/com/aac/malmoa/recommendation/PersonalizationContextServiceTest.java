package com.aac.malmoa.recommendation;

import com.aac.malmoa.domain.AacSymbol;
import com.aac.malmoa.domain.CommunicationProfile;
import com.aac.malmoa.domain.UserSymbolCustomization;
import com.aac.malmoa.domain.WordUsage;
import com.aac.malmoa.repository.CommunicationProfileRepository;
import com.aac.malmoa.repository.UserSymbolCustomizationRepository;
import com.aac.malmoa.repository.WordUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PersonalizationContextServiceTest {
    private CommunicationProfileRepository profileRepository;
    private UserSymbolCustomizationRepository customizationRepository;
    private WordUsageRepository usageRepository;
    private PersonalizationContextService service;

    @BeforeEach
    void setUp() {
        profileRepository = mock(CommunicationProfileRepository.class);
        customizationRepository = mock(UserSymbolCustomizationRepository.class);
        usageRepository = mock(WordUsageRepository.class);
        service = new PersonalizationContextService(profileRepository, customizationRepository, usageRepository);
    }

    @Test
    void snapshotShowsExactlyOrderedDeduplicatedPromptWords() {
        CommunicationProfile profile = new CommunicationProfile(1L);
        profile.update(10, 4, 3, "EASY", false, true, "짧은 요청형 선호");
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));

        UserSymbolCustomization favorite = customization(true, false, "엄마", "어머니", "엄마");
        UserSymbolCustomization important = customization(false, true, null, "물 주세요", "물");
        when(customizationRepository.findByUserId(1L)).thenReturn(List.of(favorite, important));

        WordUsage duplicateUsage = usage("엄마", 9);
        WordUsage newUsage = usage("쉬어요", 5);
        when(usageRepository.findTop20ByUserIdOrderByUsageCountDescLastUsedAtDesc(1L))
                .thenReturn(List.of(duplicateUsage, newUsage));

        PersonalizationContextService.Snapshot snapshot = service.snapshot(1L);

        assertEquals(List.of("엄마"), snapshot.favoriteWords());
        assertEquals(List.of("물 주세요"), snapshot.importantWords());
        assertEquals(List.of("엄마", "어머니", "물 주세요", "물", "쉬어요"), snapshot.promptWords());
        assertEquals(9, snapshot.frequentWords().get(0).usageCount());
        assertEquals(3, snapshot.profile().expressiveMaxEojeol());
    }

    @Test
    void snapshotUsesSafeDefaultProfileWithoutPersistingIt() {
        when(profileRepository.findByUserId(7L)).thenReturn(Optional.empty());
        when(customizationRepository.findByUserId(7L)).thenReturn(List.of());
        when(usageRepository.findTop20ByUserIdOrderByUsageCountDescLastUsedAtDesc(7L)).thenReturn(List.of());

        PersonalizationContextService.Snapshot snapshot = service.snapshot(7L);

        assertEquals(7L, snapshot.userId());
        assertEquals(4, snapshot.profile().receptiveMaxEojeol());
        assertEquals(4, snapshot.profile().expressiveMaxEojeol());
        assertEquals(List.of(), snapshot.promptWords());
    }

    private UserSymbolCustomization customization(boolean favorite, boolean important, String alias, String display, String canonical) {
        UserSymbolCustomization customization = mock(UserSymbolCustomization.class);
        AacSymbol symbol = mock(AacSymbol.class);
        when(customization.isFavorite()).thenReturn(favorite);
        when(customization.isImportantWord()).thenReturn(important);
        when(customization.getUserAlias()).thenReturn(alias);
        when(customization.getDisplayText()).thenReturn(display);
        when(customization.getSymbol()).thenReturn(symbol);
        when(symbol.getCanonicalText()).thenReturn(canonical);
        return customization;
    }

    private WordUsage usage(String word, long count) {
        WordUsage usage = mock(WordUsage.class);
        when(usage.getWord()).thenReturn(word);
        when(usage.getUsageCount()).thenReturn(count);
        return usage;
    }
}
