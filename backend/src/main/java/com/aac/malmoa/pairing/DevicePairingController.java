package com.aac.malmoa.pairing;

import com.aac.malmoa.domain.DevicePairing;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class DevicePairingController {
    private final DevicePairingService service;
    private final String frontendOrigin;

    public DevicePairingController(DevicePairingService service,
                                   @Value("${app.frontend-origin}") String frontendOrigin) {
        this.service = service;
        this.frontendOrigin = frontendOrigin.endsWith("/")
                ? frontendOrigin.substring(0, frontendOrigin.length() - 1)
                : frontendOrigin;
    }

    @PostMapping({"/api/users/{userId}/device-pairings", "/api/v1/me/aac-users/{userId}/device-pairings"})
    public CredentialResponse issue(@PathVariable Long userId) {
        return credential(service.issue(userId));
    }

    @PostMapping({"/api/users/{userId}/device-pairings/refresh", "/api/v1/me/aac-users/{userId}/device-pairings/refresh"})
    public CredentialResponse refresh(@PathVariable Long userId) {
        return credential(service.issue(userId));
    }

    @GetMapping({"/api/users/{userId}/device-pairings/current", "/api/v1/me/aac-users/{userId}/device-pairings/current"})
    public CurrentResponse current(@PathVariable Long userId) {
        DevicePairing pairing = service.current(userId);
        return new CurrentResponse(pairing.getStatus(), pairing.getExpiresAt(), service.remaining(pairing));
    }

    @PostMapping({"/api/device-pairings/claim/code", "/api/v1/device-pairings/claim/code"})
    public ClaimResponse claimCode(@Valid @RequestBody CodeClaimRequest request) {
        return ClaimResponse.from(service.claimCode(request.code(), request.toInput()));
    }

    @PostMapping({"/api/device-pairings/claim/qr", "/api/v1/device-pairings/claim/qr"})
    public ClaimResponse claimQr(@Valid @RequestBody QrClaimRequest request) {
        return ClaimResponse.from(service.claimToken(request.token(), request.toInput()));
    }

    @GetMapping({"/api/users/{userId}/devices", "/api/v1/me/aac-users/{userId}/devices"})
    public List<DeviceResponse> devices(@PathVariable Long userId) {
        return service.devices(userId).stream().map(DeviceResponse::from).toList();
    }

    private CredentialResponse credential(DevicePairing pairing) {
        return new CredentialResponse(
                pairing.getCode(),
                frontendOrigin + "/connect?token=" + pairing.getToken(),
                pairing.getExpiresAt(),
                service.remaining(pairing)
        );
    }

    public record CredentialResponse(String code, String qrPayload, LocalDateTime expiresAt, long remainingSeconds) {}
    public record CurrentResponse(String status, LocalDateTime expiresAt, long remainingSeconds) {}

    public record CodeClaimRequest(
            @NotBlank @Pattern(regexp = "\\d{6}") String code,
            @Size(max = 120) String deviceId,
            @Size(max = 160) String deviceName,
            @Pattern(regexp = "^(TABLET|MOBILE|WEB|UNKNOWN)$") String deviceType) {
        DevicePairingService.ClaimInput toInput() {
            return new DevicePairingService.ClaimInput(deviceId, deviceName, deviceType);
        }
    }

    public record QrClaimRequest(
            @NotBlank @Size(max = 80) String token,
            @Size(max = 120) String deviceId,
            @Size(max = 160) String deviceName,
            @Pattern(regexp = "^(TABLET|MOBILE|WEB|UNKNOWN)$") String deviceType) {
        DevicePairingService.ClaimInput toInput() {
            return new DevicePairingService.ClaimInput(deviceId, deviceName, deviceType);
        }
    }

    public record ClaimResponse(Long aacUserId, String deviceId, LocalDateTime pairedAt) {
        static ClaimResponse from(DevicePairing pairing) {
            return new ClaimResponse(pairing.getUserId(), pairing.getDeviceId(), pairing.getPairedAt());
        }
    }

    public record DeviceResponse(String deviceId, String deviceName, String deviceType, LocalDateTime pairedAt) {
        static DeviceResponse from(DevicePairing pairing) {
            return new DeviceResponse(pairing.getDeviceId(), pairing.getDeviceName(), pairing.getDeviceType(), pairing.getPairedAt());
        }
    }
}
