package com.aac.malmoa.recommendation;

import com.aac.malmoa.domain.RecommendationHistory;
import com.aac.malmoa.repository.RecommendationHistoryRepository;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static com.aac.malmoa.recommendation.RecommendationDtos.*;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {
    private final RecommendationService service;
    private final RecommendationHistoryRepository historyRepository;

    public RecommendationController(RecommendationService service, RecommendationHistoryRepository historyRepository) {
        this.service = service;
        this.historyRepository = historyRepository;
    }

    @PostMapping("/personalized")
    public Result personalized(@Valid @RequestBody Request request) {
        return service.personalized(request);
    }

    @PostMapping("/baseline")
    public Result baseline(@Valid @RequestBody Request request) {
        return service.baseline(request);
    }

    @PostMapping("/compare")
    public Comparison compare(@Valid @RequestBody Request request) {
        return service.compare(request);
    }

    @PostMapping("/selection")
    @Transactional
    public void selection(@Valid @RequestBody SelectionRequest request) {
        RecommendationHistory history = historyRepository
                .findFirstByUserIdAndModeAndGeneratedSentenceOrderByCreatedAtDesc(
                        request.userId(), request.mode(), request.sentence())
                .orElseThrow();
        history.markSelected();
        historyRepository.save(history);
    }

    @GetMapping("/stats/{userId}")
    @Transactional(readOnly = true)
    public Stats stats(@PathVariable Long userId) {
        List<RecommendationHistory> all = historyRepository.findTop200ByUserIdOrderByCreatedAtDesc(userId);
        return new Stats(modeStats(all, "baseline"), modeStats(all, "personalized"));
    }

    @GetMapping(value = "/export/{userId}", produces = "text/csv; charset=UTF-8")
    @Transactional(readOnly = true)
    public void export(@PathVariable Long userId, HttpServletResponse response) throws IOException {
        response.setHeader("Content-Disposition", "attachment; filename=malmoa-experiment-" + userId + ".csv");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        StringBuilder csv = new StringBuilder("mode,generation_source,situation,intent,sentence,eojeol_count,personal_word_count,selected,created_at\n");
        for (RecommendationHistory history : historyRepository.findTop200ByUserIdOrderByCreatedAtDesc(userId)) {
            csv.append(q(history.getMode())).append(',')
                    .append(q(history.getGenerationSource())).append(',')
                    .append(q(history.getSituation())).append(',')
                    .append(q(history.getSourceIntent())).append(',')
                    .append(q(history.getGeneratedSentence())).append(',')
                    .append(history.getEojeolCount()).append(',')
                    .append(history.getPersonalWordCount()).append(',')
                    .append(history.isSelected()).append(',')
                    .append(q(history.getCreatedAt().toString())).append('\n');
        }
        response.getOutputStream().write(csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    private ModeStats modeStats(List<RecommendationHistory> all, String mode) {
        List<RecommendationHistory> items = all.stream().filter(h -> mode.equals(h.getMode())).toList();
        long selected = items.stream().filter(RecommendationHistory::isSelected).count();
        long gemini = items.stream().filter(h -> "gemini".equals(h.getGenerationSource())).count();
        long fallback = items.stream().filter(h -> "fallback".equals(h.getGenerationSource())).count();
        return new ModeStats(
                items.size(),
                selected,
                items.isEmpty() ? 0 : (double) selected / items.size(),
                items.stream().mapToInt(RecommendationHistory::getEojeolCount).average().orElse(0),
                items.stream().mapToInt(RecommendationHistory::getPersonalWordCount).average().orElse(0),
                gemini,
                fallback
        );
    }

    private String q(String value) {
        return "\"" + (value == null ? "" : value.replace("\"", "\"\"")) + "\"";
    }

    public record SelectionRequest(@NotNull Long userId, @NotBlank String mode, @NotBlank String sentence) {}

    public record ModeStats(long generatedCount,
                            long selectedCount,
                            double selectionRate,
                            double averageEojeol,
                            double averagePersonalWordCount,
                            long geminiGeneratedCount,
                            long fallbackGeneratedCount) {}

    public record Stats(ModeStats baseline, ModeStats personalized) {}
}
