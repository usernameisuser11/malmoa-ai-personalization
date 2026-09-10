package com.aac.malmoa.recommendation;

import com.aac.malmoa.domain.RecommendationHistory;
import com.aac.malmoa.repository.RecommendationHistoryRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

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
    public Result personalized(@Valid @RequestBody Request request) { return service.personalized(request); }

    @PostMapping("/baseline")
    public Result baseline(@Valid @RequestBody Request request) { return service.baseline(request); }

    @PostMapping("/compare")
    public Comparison compare(@Valid @RequestBody Request request) { return service.compare(request); }

    @PostMapping("/selection")
    @Transactional
    public void selection(@Valid @RequestBody SelectionRequest request) {
        RecommendationHistory history = historyRepository
                .findFirstByUserIdAndGeneratedSentenceOrderByCreatedAtDesc(request.userId(), request.sentence())
                .orElseThrow();
        history.markSelected();
        historyRepository.save(history);
    }

    @GetMapping("/stats/{userId}")
    @Transactional(readOnly = true)
    public Stats stats(@PathVariable Long userId) {
        List<RecommendationHistory> items = historyRepository.findTop200ByUserIdOrderByCreatedAtDesc(userId);
        long selected = items.stream().filter(RecommendationHistory::isSelected).count();
        double avgEojeol = items.stream().mapToInt(RecommendationHistory::getEojeolCount).average().orElse(0);
        double avgPersonal = items.stream().mapToInt(RecommendationHistory::getPersonalWordCount).average().orElse(0);
        return new Stats(items.size(), selected, items.isEmpty() ? 0 : (double) selected / items.size(), avgEojeol, avgPersonal);
    }

    public record SelectionRequest(@NotNull Long userId, @NotBlank String sentence) {}
    public record Stats(long generatedCount, long selectedCount, double selectionRate,
                        double averageEojeol, double averagePersonalWordCount) {}
}
