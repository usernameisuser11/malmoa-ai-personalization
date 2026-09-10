package com.aac.malmoa.repository;

import com.aac.malmoa.domain.GuardianNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GuardianNotificationRepository extends JpaRepository<GuardianNotification, Long> {
    List<GuardianNotification> findTop50ByAacUserIdOrderByCreatedAtDesc(Long aacUserId);
}
