package com.aac.malmoa.recommendation;

import com.aac.malmoa.domain.CommunicationProfile;
import com.aac.malmoa.domain.RecommendationHistory;
import com.aac.malmoa.repository.CommunicationProfileRepository;
import com.aac.malmoa.repository.RecommendationHistoryRepository;
import com.aac.malmoa.repository.UserSymbolCustomizationRepository;
import com.aac.malmoa.repository.WordUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static com.aac.malmoa.recommendation.RecommendationDtos.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class RecommendationServiceTest {
    private CommunicationProfileRepository profileRepository;
    private UserSymbolCustomizationRepository customizationRepository;
    private WordUsageRepository usageRepository;
    private RecommendationHistoryRepository historyRepository;
    private GeminiClient gemini;
    private RecommendationService service;
    private CommunicationProfile profile;

    @BeforeEach
    void setUp() {
        profileRepository = mock(CommunicationProfileRepository.class);
        customizationRepository = mock(UserSymbolCustomizationRepository.class);
        usageRepository = mock(WordUsageRepository.class);
        historyRepository = mock(RecommendationHistoryRepository.class);
        gemini = mock(GeminiClient.class);
        service = new RecommendationService(profileRepository, customizationRepository, usageRepository, historyRepository, gemini);

        profile = new CommunicationProfile(1L);
        profile.update(10, 3, 2, "VERY_EASY", false, false, "짧고 직접적인 표현을 선호함");
        when(profileRepository.findByUserId(1L)).thenReturn(Optional.of(profile));
        when(customizationRepository.findByUserId(1L)).thenReturn(List.of());
        when(usageRepository.findTop20ByUserIdOrderByUsageCountDescLastUsedAtDesc(1L)).thenReturn(List.of());
        when(historyRepository.save(any(RecommendationHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void personalizedFallbackNeverExceedsConfiguredEojeolLimit() {
        when(gemini.generateSentences(anyString())).thenReturn(List.of());
        Request request = new Request(1L, "학교", "물을 마시고 싶어요", List.of("물"));

        Result result = service.personalized(request);

        assertEquals("fallback", result.source());
        assertEquals(2, result.maxEojeol());
        assertFalse(result.candidates().isEmpty());
        assertTrue(result.candidates().stream().allMatch(Candidate::valid));
        assertTrue(result.candidates().stream().allMatch(candidate -> candidate.eojeolCount() <= 2));
        verify(historyRepository, atLeastOnce()).save(any(RecommendationHistory.class));
    }

    @Test
    void marksResultAsGeminiWhenThreeValidLiveCandidatesAreReturned() {
        when(gemini.generateSentences(anyString())).thenReturn(List.of("물 주세요", "선생님 물", "물 마셔요"));
        Request request = new Request(1L, "학교", "물을 요청한다", List.of("물"));

        Result result = service.personalized(request);

        assertEquals("gemini", result.source());
        assertEquals(3, result.candidates().size());
        assertTrue(result.candidates().stream().allMatch(Candidate::valid));
    }

    @Test
    void fallsBackEntirelyWhenGeminiCannotProduceThreeValidPersonalizedCandidates() {
        when(gemini.generateSentences(anyString()))
                .thenReturn(List.of("물 주세요", "이 문장은 두 어절 제한보다 훨씬 깁니다", "첫 문장. 두 번째 문장."))
                .thenReturn(List.of());
        Request request = new Request(1L, "학교", "물을 요청한다", List.of("물"));

        Result result = service.personalized(request);

        assertEquals("fallback", result.source());
        assertFalse(result.candidates().isEmpty());
        assertTrue(result.candidates().stream().allMatch(Candidate::valid));
        assertTrue(result.candidates().stream().allMatch(candidate -> candidate.eojeolCount() <= 2));
    }

    @Test
    void baselineAlsoReportsFallbackInsteadOfPretendingAiWasUsed() {
        when(gemini.generateSentences(anyString())).thenReturn(List.of());
        Request request = new Request(1L, "집", "쉬고 싶다", List.of());

        Result result = service.baseline(request);

        assertEquals("fallback", result.source());
        assertFalse(result.candidates().isEmpty());
        assertTrue(result.candidates().stream().allMatch(Candidate::valid));
    }
}
