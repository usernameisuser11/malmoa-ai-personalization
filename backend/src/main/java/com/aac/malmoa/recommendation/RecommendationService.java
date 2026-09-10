package com.aac.malmoa.recommendation;

import com.aac.malmoa.domain.CommunicationProfile;
import com.aac.malmoa.domain.RecommendationHistory;
import com.aac.malmoa.domain.UserSymbolCustomization;
import com.aac.malmoa.repository.CommunicationProfileRepository;
import com.aac.malmoa.repository.RecommendationHistoryRepository;
import com.aac.malmoa.repository.UserSymbolCustomizationRepository;
import com.aac.malmoa.repository.WordUsageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import static com.aac.malmoa.recommendation.RecommendationDtos.*;

@Service
public class RecommendationService {
    private final CommunicationProfileRepository profileRepository;
    private final UserSymbolCustomizationRepository customizationRepository;
    private final WordUsageRepository usageRepository;
    private final RecommendationHistoryRepository historyRepository;
    private final GeminiClient gemini;

    public RecommendationService(CommunicationProfileRepository profileRepository,
                                 UserSymbolCustomizationRepository customizationRepository,
                                 WordUsageRepository usageRepository,
                                 RecommendationHistoryRepository historyRepository,
                                 GeminiClient gemini) {
        this.profileRepository = profileRepository;
        this.customizationRepository = customizationRepository;
        this.usageRepository = usageRepository;
        this.historyRepository = historyRepository;
        this.gemini = gemini;
    }

    @Transactional
    public Result personalized(Request request) {
        CommunicationProfile profile = profileRepository.findByUserId(request.userId())
                .orElseGet(() -> profileRepository.save(new CommunicationProfile(request.userId())));
        List<String> personalWords = personalWords(request.userId());
        List<String> generated = gemini.generateSentences(personalizedPrompt(request, profile, personalWords));
        if (generated.isEmpty()) generated = fallback(request, profile.getExpressiveMaxEojeol());
        List<Candidate> candidates = evaluate(generated, profile.getExpressiveMaxEojeol(), personalWords);

        long validCount = candidates.stream().filter(Candidate::valid).count();
        if (validCount < 3 && !generated.isEmpty()) {
            List<String> repaired = gemini.generateSentences(repairPrompt(request, profile, personalWords, candidates));
            if (!repaired.isEmpty()) {
                List<String> merged = new ArrayList<>();
                candidates.stream().filter(Candidate::valid).map(Candidate::sentence).forEach(merged::add);
                merged.addAll(repaired);
                candidates = evaluate(merged, profile.getExpressiveMaxEojeol(), personalWords);
            }
        }
        if (candidates.stream().filter(Candidate::valid).count() < 1) {
            candidates = evaluate(fallback(request, profile.getExpressiveMaxEojeol()), profile.getExpressiveMaxEojeol(), personalWords);
        }
        saveHistory(request, candidates, "personalized");
        return new Result(request.userId(), "personalized", request.situation(), personalWords,
                profile.getExpressiveMaxEojeol(), candidates);
    }

    @Transactional
    public Result baseline(Request request) {
        String prompt = "AAC 사용자가 상황에서 말할 수 있는 자연스러운 한국어 문장 3개를 추천해줘. " +
                "상황: " + request.situation() + ". 의도: " + safe(request.intent()) +
                ". 선택한 단어: " + String.join(", ", safeWords(request.selectedWords())) +
                ". 사용자가 선택하지 않은 새로운 의도나 사실은 추가하지 마. JSON {\"sentences\":[\"...\"]} 형식으로만 답해.";
        List<String> generated = gemini.generateSentences(prompt);
        if (generated.isEmpty()) generated = fallback(request, 20);
        List<Candidate> candidates = evaluate(generated, 100, List.of());
        saveHistory(request, candidates, "baseline");
        return new Result(request.userId(), "baseline", request.situation(), List.of(), null, candidates);
    }

    @Transactional
    public Comparison compare(Request request) {
        Result baseline = baseline(request);
        Result personalized = personalized(request);
        return new Comparison(baseline, personalized);
    }

    private String personalizedPrompt(Request request, CommunicationProfile p, List<String> personalWords) {
        String abstractRule = p.isAllowAbstractLanguage() ? "필요하면 일반적인 추상 표현 사용 가능" : "비유와 추상 표현 금지";
        String causalRule = p.isAllowCausalExpression() ? "간단한 이유 표현 가능" : "이유를 덧붙이는 종속절은 피함";
        return """
                너는 AAC 의사소통 보조 문장 생성기다. 사용자의 지능이나 장애 정도를 추정하지 말고 아래에 제공된 실제 의사소통 프로필만 따른다.
                사용자가 선택하지 않은 새로운 의도, 감정, 사실을 임의로 추가하지 않는다.

                [사용자 프로필]
                연령: %s
                표현 가능한 최대 문장 길이: %d어절
                이해 가능한 권장 문장 길이: %d어절
                어휘 수준: %s
                언어 규칙: %s, %s
                보호자 메모: %s

                [개인 어휘 - 자연스러운 경우 최우선 사용]
                %s

                [현재 상황]
                %s

                [사용자가 표현하려는 의도]
                %s

                [선택한 AAC 카드 - 최대 3개]
                %s

                [생성 규칙]
                1. 한국어 문장 후보를 정확히 3개 만든다.
                2. 각 문장은 %d어절을 절대 넘지 않는다.
                3. 한 문장에는 핵심 의도 하나만 둔다.
                4. 일상적이고 구체적인 단어를 우선한다.
                5. 개인 어휘가 문맥에 맞으면 일반 동의어보다 우선한다.
                6. 선택 카드의 의미를 보존한다.
                7. 출력은 JSON {"sentences":["문장1","문장2","문장3"]} 만 반환한다.
                """.formatted(p.getAge() == null ? "미설정" : p.getAge(), p.getExpressiveMaxEojeol(),
                p.getReceptiveMaxEojeol(), p.getVocabularyLevel(), abstractRule, causalRule, safe(p.getNotes()),
                personalWords.isEmpty() ? "없음" : String.join(", ", personalWords), request.situation(),
                safe(request.intent()), String.join(", ", safeWords(request.selectedWords())), p.getExpressiveMaxEojeol());
    }

    private String repairPrompt(Request request, CommunicationProfile p, List<String> personalWords, List<Candidate> first) {
        return "다음 AAC 후보들이 길이 조건을 일부 어겼다. 의미는 유지하면서 각 문장을 반드시 " + p.getExpressiveMaxEojeol() +
                "어절 이하로 다시 만들어라. 새로운 의도를 추가하지 마라. 개인 어휘가 자연스러우면 우선 사용: " +
                String.join(", ", personalWords) + ". 상황: " + request.situation() + ". 원래 의도: " + safe(request.intent()) +
                ". 후보: " + first.stream().map(Candidate::sentence).toList() +
                ". JSON {\"sentences\":[\"문장1\",\"문장2\",\"문장3\"]}만 반환.";
    }

    private List<String> personalWords(Long userId) {
        LinkedHashSet<String> words = new LinkedHashSet<>();
        List<UserSymbolCustomization> custom = customizationRepository.findByUserId(userId);
        custom.stream().filter(c -> c.isFavorite() || c.isImportantWord()).forEach(c -> {
            if (c.getUserAlias() != null) words.add(c.getUserAlias());
            if (c.getDisplayText() != null) words.add(c.getDisplayText());
            words.add(c.getSymbol().getCanonicalText());
        });
        usageRepository.findTop20ByUserIdOrderByUsageCountDescLastUsedAtDesc(userId).forEach(u -> words.add(u.getWord()));
        return words.stream().limit(30).toList();
    }

    private List<Candidate> evaluate(List<String> sentences, int maxEojeol, List<String> personalWords) {
        return sentences.stream().map(this::normalize).filter(s -> !s.isBlank()).distinct().map(sentence -> {
            int eojeol = eojeolCount(sentence);
            List<String> violations = new ArrayList<>();
            if (eojeol > maxEojeol) violations.add("MAX_EOJEOL_EXCEEDED");
            int personalCount = (int) personalWords.stream().filter(sentence::contains).distinct().count();
            return new Candidate(sentence, eojeol, personalCount, violations.isEmpty(), violations);
        }).sorted(Comparator.comparing(Candidate::valid).reversed()
                .thenComparing(Candidate::personalWordCount, Comparator.reverseOrder())
                .thenComparing(Candidate::eojeolCount)).limit(3).toList();
    }

    private void saveHistory(Request request, List<Candidate> candidates, String mode) {
        candidates.forEach(c -> historyRepository.save(new RecommendationHistory(request.userId(), mode, request.situation(),
                request.intent(), c.sentence(), c.eojeolCount(), c.personalWordCount())));
    }

    private List<String> fallback(Request request, int maxEojeol) {
        List<String> selected = safeWords(request.selectedWords());
        List<String> raw = new ArrayList<>();
        if (!selected.isEmpty()) raw.add(String.join(" ", selected));
        if (request.intent() != null && !request.intent().isBlank()) raw.add(request.intent().trim());
        if (selected.size() >= 2) raw.add(selected.get(0) + " " + selected.get(selected.size() - 1));
        if (raw.isEmpty()) raw.add("도와주세요");
        return raw.stream().map(s -> trimToEojeol(s, maxEojeol)).map(this::normalize).distinct().limit(3).toList();
    }
    private String trimToEojeol(String value, int max) { String[] parts=value.trim().split("\\s+"); return String.join(" ", Arrays.copyOf(parts, Math.min(parts.length, Math.max(1,max)))); }
    private int eojeolCount(String value) { return value.isBlank()?0:value.trim().split("\\s+").length; }
    private String normalize(String value) { String s=value==null?"":value.trim().replaceAll("^[\\-•\\d.\\s]+",""); if(!s.isBlank()&&!s.matches(".*[.!?요다까]$"))s+="."; return s; }
    private String safe(String value) { return value==null||value.isBlank()?"미지정":value.trim(); }
    private List<String> safeWords(List<String> words) { return words==null?List.of():words.stream().filter(Objects::nonNull).map(String::trim).filter(s->!s.isBlank()).limit(3).toList(); }
}
