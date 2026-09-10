package com.aac.malmoa.repository;

import com.aac.malmoa.domain.WordUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WordUsageRepository extends JpaRepository<WordUsage, Long> {
    Optional<WordUsage> findByUserIdAndWord(Long userId, String word);
    List<WordUsage> findTop20ByUserIdOrderByUsageCountDescLastUsedAtDesc(Long userId);
}
