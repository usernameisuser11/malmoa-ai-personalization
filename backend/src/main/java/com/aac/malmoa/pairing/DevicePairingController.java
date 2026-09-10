package com.aac.malmoa.pairing;

import com.aac.malmoa.domain.DevicePairing;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
public class DevicePairingController {
    private final DevicePairingService service;
    public DevicePairingController(DevicePairingService service){this.service=service;}

    @PostMapping("/api/users/{userId}/device-pairings")
    public CredentialResponse issue(@PathVariable Long userId){return CredentialResponse.from(service.issue(userId),service);}

    @PostMapping("/api/users/{userId}/device-pairings/refresh")
    public CredentialResponse refresh(@PathVariable Long userId){return CredentialResponse.from(service.issue(userId),service);}

    @GetMapping("/api/users/{userId}/device-pairings/current")
    public CurrentResponse current(@PathVariable Long userId){DevicePairing p=service.current(userId);return new CurrentResponse(p.getStatus(),p.getExpiresAt(),service.remaining(p));}

    @PostMapping("/api/device-pairings/claim/code")
    public ClaimResponse claimCode(@RequestBody CodeClaimRequest request){return ClaimResponse.from(service.claimCode(request.code(),new DevicePairingService.ClaimInput(request.deviceId(),request.deviceName(),request.deviceType())));}

    @PostMapping("/api/device-pairings/claim/qr")
    public ClaimResponse claimQr(@RequestBody QrClaimRequest request){return ClaimResponse.from(service.claimToken(request.token(),new DevicePairingService.ClaimInput(request.deviceId(),request.deviceName(),request.deviceType())));}

    @GetMapping("/api/users/{userId}/devices")
    public List<DeviceResponse> devices(@PathVariable Long userId){return service.devices(userId).stream().map(DeviceResponse::from).toList();}

    public record CredentialResponse(String code,String qrPayload,LocalDateTime expiresAt,long remainingSeconds){static CredentialResponse from(DevicePairing p,DevicePairingService s){return new CredentialResponse(p.getCode(),"malmoa://pair?token="+p.getToken(),p.getExpiresAt(),s.remaining(p));}}
    public record CurrentResponse(String status,LocalDateTime expiresAt,long remainingSeconds){}
    public record CodeClaimRequest(String code,String deviceId,String deviceName,String deviceType){}
    public record QrClaimRequest(String token,String deviceId,String deviceName,String deviceType){}
    public record ClaimResponse(Long aacUserId,String deviceId,LocalDateTime pairedAt){static ClaimResponse from(DevicePairing p){return new ClaimResponse(p.getUserId(),p.getDeviceId(),p.getPairedAt());}}
    public record DeviceResponse(String deviceId,String deviceName,String deviceType,LocalDateTime pairedAt){static DeviceResponse from(DevicePairing p){return new DeviceResponse(p.getDeviceId(),p.getDeviceName(),p.getDeviceType(),p.getPairedAt());}}
}
