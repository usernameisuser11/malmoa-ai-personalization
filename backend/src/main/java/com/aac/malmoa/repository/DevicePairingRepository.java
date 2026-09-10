package com.aac.malmoa.repository;

import com.aac.malmoa.domain.DevicePairing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DevicePairingRepository extends JpaRepository<DevicePairing, Long> {
    Optional<DevicePairing> findFirstByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);
    List<DevicePairing> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, String status);
    Optional<DevicePairing> findByCode(String code);
    Optional<DevicePairing> findByToken(String token);
    boolean existsByCode(String code);
    List<DevicePairing> findByUserIdAndStatusOrderByPairedAtDesc(Long userId, String status);
}
