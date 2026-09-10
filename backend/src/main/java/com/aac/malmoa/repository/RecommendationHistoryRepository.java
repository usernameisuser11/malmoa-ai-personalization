package com.aac.malmoa.repository;

import com.aac.malmoa.domain.RecommendationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RecommendationHistoryRepository extends JpaRepository<RecommendationHistory, Long> {
    List<RecommendationHistory> findTop200ByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<RecommendationHistory> findFirstByUserIdAndGeneratedSentenceOrderByCreatedAtDesc(Long userId, String generatedSentence);
}
