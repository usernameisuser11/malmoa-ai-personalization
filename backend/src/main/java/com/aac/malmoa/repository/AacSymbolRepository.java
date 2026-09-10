package com.aac.malmoa.repository;

import com.aac.malmoa.domain.AacSymbol;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AacSymbolRepository extends JpaRepository<AacSymbol, Long> {
    List<AacSymbol> findAllByOrderByCategoryAscCanonicalTextAsc();
    List<AacSymbol> findByEmergencyTrueOrderByIdAsc();
}
