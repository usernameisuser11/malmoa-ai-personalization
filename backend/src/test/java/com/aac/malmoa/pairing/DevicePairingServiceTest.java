package com.aac.malmoa.pairing;

import com.aac.malmoa.domain.DevicePairing;
import com.aac.malmoa.repository.DevicePairingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class DevicePairingServiceTest {
    private DevicePairingRepository repository;
    private DevicePairingService service;

    @BeforeEach
    void setUp() {
        repository = mock(DevicePairingRepository.class);
        service = new DevicePairingService(repository);
        when(repository.save(any(DevicePairing.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void issueRevokesAllActivePairingsAndCreatesSixDigitCredential() {
        DevicePairing first = new DevicePairing(1L, "111111", "token-a", LocalDateTime.now().plusMinutes(5));
        DevicePairing second = new DevicePairing(1L, "222222", "token-b", LocalDateTime.now().plusMinutes(5));
        when(repository.findByUserIdAndStatusOrderByCreatedAtDesc(1L, "ACTIVE")).thenReturn(List.of(first, second));
        when(repository.existsByCode(anyString())).thenReturn(false);

        DevicePairing issued = service.issue(1L);

        assertEquals("REVOKED", first.getStatus());
        assertEquals("REVOKED", second.getStatus());
        assertTrue(issued.getCode().matches("\\d{6}"));
        assertEquals(64, issued.getToken().length());
        assertEquals("ACTIVE", issued.getStatus());
        assertTrue(issued.getExpiresAt().isAfter(LocalDateTime.now().plusMinutes(9)));
    }

    @Test
    void currentReturnsGoneForExpiredActivePairing() {
        DevicePairing expired = new DevicePairing(1L, "123456", "token", LocalDateTime.now().minusSeconds(1));
        when(repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(1L, "ACTIVE")).thenReturn(Optional.of(expired));

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.current(1L));
        assertEquals(HttpStatus.GONE, error.getStatusCode());
    }

    @Test
    void claimRejectsRevokedPairingBeforeExpiryCheck() {
        DevicePairing pairing = new DevicePairing(1L, "123456", "token", LocalDateTime.now().minusMinutes(1));
        pairing.revoke();
        when(repository.findByCode("123456")).thenReturn(Optional.of(pairing));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.claimCode("123456", new DevicePairingService.ClaimInput("device-1", "테스트", "WEB")));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
    }

    @Test
    void claimStoresValidatedDeviceInformation() {
        DevicePairing pairing = new DevicePairing(7L, "123456", "token", LocalDateTime.now().plusMinutes(5));
        when(repository.findByCode("123456")).thenReturn(Optional.of(pairing));

        DevicePairing claimed = service.claimCode("123456",
                new DevicePairingService.ClaimInput("device-1", "사용자 태블릿", "TABLET"));

        assertEquals("CLAIMED", claimed.getStatus());
        assertEquals("device-1", claimed.getDeviceId());
        assertEquals("사용자 태블릿", claimed.getDeviceName());
        assertEquals("TABLET", claimed.getDeviceType());
        assertNotNull(claimed.getPairedAt());
    }
}
