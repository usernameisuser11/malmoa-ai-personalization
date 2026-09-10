package com.aac.malmoa.recommendation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class RecommendationDtos {
    private RecommendationDtos() {}

    public record Request(
            @NotNull Long userId,
            @NotBlank String situation,
            String intent,
            @Size(max = 3) List<String> selectedWords) {}

    public record Candidate(String sentence, int eojeolCount, int personalWordCount,
                            boolean valid, List<String> violations) {}

    public record Result(Long userId, String mode, String source, String situation, List<String> personalWords,
                         Integer maxEojeol, List<Candidate> candidates) {}

    public record Comparison(Result baseline, Result personalized) {}
}
