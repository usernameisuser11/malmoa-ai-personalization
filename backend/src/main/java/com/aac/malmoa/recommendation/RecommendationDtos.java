package com.aac.malmoa.recommendation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class RecommendationDtos {
    private RecommendationDtos() {}

    public record Request(
            @NotNull @Min(1) Long userId,
            @NotBlank @Size(max = 100) String situation,
            @Size(max = 500) String intent,
            @Valid @Size(max = 3) List<@NotBlank @Size(max = 100) String> selectedWords) {}

    public record Candidate(String sentence, int eojeolCount, int personalWordCount,
                            boolean valid, List<String> violations) {}

    public record Result(Long userId, String mode, String source, String situation, List<String> personalWords,
                         Integer maxEojeol, List<Candidate> candidates) {}

    public record Comparison(Result baseline, Result personalized) {}
}
