package com.aac.malmoa.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "device_pairings")
public class DevicePairing {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "pair_code", nullable = false, unique = true, length = 6)
    private String code;
    @Column(name = "pair_token", nullable = false, unique = true, length = 80)
    private String token;
    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "device_id")
    private String deviceId;
    @Column(name = "device_name")
    private String deviceName;
    @Column(name = "device_type")
    private String deviceType;
    @Column(name = "paired_at")
    private LocalDateTime pairedAt;

    protected DevicePairing() {}
    public DevicePairing(Long userId, String code, String token, LocalDateTime expiresAt) {
        this.userId = userId; this.code = code; this.token = token; this.expiresAt = expiresAt;
    }
    public Long getId(){return id;} public Long getUserId(){return userId;} public String getCode(){return code;}
    public String getToken(){return token;} public String getStatus(){return status;} public LocalDateTime getExpiresAt(){return expiresAt;}
    public String getDeviceId(){return deviceId;} public String getDeviceName(){return deviceName;} public String getDeviceType(){return deviceType;}
    public LocalDateTime getPairedAt(){return pairedAt;}
    public boolean expired(){return LocalDateTime.now().isAfter(expiresAt);}
    public void revoke(){if("ACTIVE".equals(status)) status="REVOKED";}
    public void claim(String deviceId,String deviceName,String deviceType){this.status="CLAIMED";this.deviceId=deviceId;this.deviceName=deviceName;this.deviceType=deviceType;this.pairedAt=LocalDateTime.now();}
}
