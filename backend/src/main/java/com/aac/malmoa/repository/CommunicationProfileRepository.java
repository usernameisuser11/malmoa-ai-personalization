package com.aac.malmoa.repository;

import com.aac.malmoa.domain.CommunicationProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CommunicationProfileRepository extends JpaRepository<CommunicationProfile, Long> {
    Optional<CommunicationProfile> findByUserId(Long userId);
}
