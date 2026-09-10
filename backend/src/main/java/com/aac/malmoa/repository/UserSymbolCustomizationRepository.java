package com.aac.malmoa.repository;

import com.aac.malmoa.domain.UserSymbolCustomization;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserSymbolCustomizationRepository extends JpaRepository<UserSymbolCustomization, Long> {
    Optional<UserSymbolCustomization> findByUserIdAndSymbolId(Long userId, Long symbolId);
    List<UserSymbolCustomization> findByUserId(Long userId);
    List<UserSymbolCustomization> findByUserIdAndFavoriteTrue(Long userId);
}
