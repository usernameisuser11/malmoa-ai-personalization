package com.aac.malmoa.pairing;

import com.aac.malmoa.domain.DevicePairing;
import com.aac.malmoa.repository.DevicePairingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class DevicePairingService {
    private static final Set<String> DEVICE_TYPES = Set.of("TABLET", "MOBILE", "WEB", "UNKNOWN");
    private final DevicePairingRepository repository;
    private final SecureRandom random = new SecureRandom();

    public DevicePairingService(DevicePairingRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public DevicePairing issue(Long userId) {
        requireUserId(userId);
        repository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, "ACTIVE").forEach(pairing -> {
            pairing.revoke();
            repository.save(pairing);
        });

        String code = generateUniqueCode();
        String token = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
        return repository.save(new DevicePairing(userId, code, token, LocalDateTime.now().plusMinutes(10)));
    }

    @Transactional(readOnly = true)
    public DevicePairing current(Long userId) {
        requireUserId(userId);
        DevicePairing pairing = repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, "ACTIVE")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "활성 연결 코드가 없습니다."));
        if (pairing.expired()) {
            throw new ResponseStatusException(HttpStatus.GONE, "연결 코드가 만료되었습니다.");
        }
        return pairing;
    }

    @Transactional
    public DevicePairing claimCode(String code, ClaimInput input) {
        String normalized = code == null ? "" : code.trim();
        if (!normalized.matches("\\d{6}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "연결 코드는 6자리 숫자입니다.");
        }
        DevicePairing pairing = repository.findByCode(normalized)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "연결 코드를 찾을 수 없습니다."));
        return claim(pairing, input);
    }

    @Transactional
    public DevicePairing claimToken(String token, ClaimInput input) {
        String normalized = token == null ? "" : token.trim();
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "QR 토큰이 필요합니다.");
        }
        DevicePairing pairing = repository.findByToken(normalized)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "QR 연결 정보를 찾을 수 없습니다."));
        return claim(pairing, input);
    }

    @Transactional(readOnly = true)
    public List<DevicePairing> devices(Long userId) {
        requireUserId(userId);
        return repository.findByUserIdAndStatusOrderByPairedAtDesc(userId, "CLAIMED");
    }

    public long remaining(DevicePairing pairing) {
        return Math.max(0, Duration.between(LocalDateTime.now(), pairing.getExpiresAt()).getSeconds());
    }

    private DevicePairing claim(DevicePairing pairing, ClaimInput input) {
        if (!"ACTIVE".equals(pairing.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용되었거나 취소된 연결 코드입니다.");
        }
        if (pairing.expired()) {
            throw new ResponseStatusException(HttpStatus.GONE, "연결 코드가 만료되었습니다.");
        }
        if (input == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "기기 정보가 필요합니다.");
        }

        String deviceId = clean(input.deviceId(), UUID.randomUUID().toString(), 120, "기기 ID");
        String deviceName = clean(input.deviceName(), "말모아 기기", 160, "기기 이름");
        String deviceType = clean(input.deviceType(), "UNKNOWN", 30, "기기 종류").toUpperCase(Locale.ROOT);
        if (!DEVICE_TYPES.contains(deviceType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "지원하지 않는 기기 종류입니다.");
        }

        pairing.claim(deviceId, deviceName, deviceType);
        return repository.save(pairing);
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 100; attempt++) {
            String code = String.format("%06d", random.nextInt(1_000_000));
            if (!repository.existsByCode(code)) return code;
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "연결 코드를 생성하지 못했습니다. 다시 시도해주세요.");
    }

    private String clean(String value, String fallback, int maxLength, String label) {
        String normalized = value == null || value.isBlank() ? fallback : value.trim();
        if (normalized.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + "이(가) 너무 깁니다.");
        }
        return normalized;
    }

    private void requireUserId(Long userId) {
        if (userId == null || userId < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사용자 ID를 확인해주세요.");
        }
    }

    public record ClaimInput(String deviceId, String deviceName, String deviceType) {}
}
