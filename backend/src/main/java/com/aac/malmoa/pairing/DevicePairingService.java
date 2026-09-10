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
import java.util.UUID;

@Service
public class DevicePairingService {
    private final DevicePairingRepository repository;
    private final SecureRandom random=new SecureRandom();
    public DevicePairingService(DevicePairingRepository repository){this.repository=repository;}

    @Transactional
    public DevicePairing issue(Long userId){
        repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId,"ACTIVE").ifPresent(p->{p.revoke();repository.save(p);});
        String code;do{code=String.format("%06d",random.nextInt(1_000_000));}while(repository.existsByCode(code));
        String token=UUID.randomUUID().toString().replace("-","")+UUID.randomUUID().toString().replace("-","");
        return repository.save(new DevicePairing(userId,code,token,LocalDateTime.now().plusMinutes(10)));
    }

    @Transactional(readOnly=true)
    public DevicePairing current(Long userId){return repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId,"ACTIVE").orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"활성 연결 코드가 없습니다."));}

    @Transactional
    public DevicePairing claimCode(String code,ClaimInput input){
        if(code==null||!code.matches("\\d{6}"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"연결 코드는 6자리 숫자입니다.");
        return claim(repository.findByCode(code).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"연결 코드를 찾을 수 없습니다.")),input);
    }

    @Transactional
    public DevicePairing claimToken(String token,ClaimInput input){
        if(token==null||token.isBlank())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"QR 토큰이 필요합니다.");
        return claim(repository.findByToken(token).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"QR 연결 정보를 찾을 수 없습니다.")),input);
    }

    private DevicePairing claim(DevicePairing pairing,ClaimInput input){
        if(pairing.expired())throw new ResponseStatusException(HttpStatus.GONE,"연결 코드가 만료되었습니다.");
        if(!"ACTIVE".equals(pairing.getStatus()))throw new ResponseStatusException(HttpStatus.CONFLICT,"이미 사용되었거나 취소된 연결 코드입니다.");
        String deviceId=input.deviceId()==null||input.deviceId().isBlank()?UUID.randomUUID().toString():input.deviceId().trim();
        pairing.claim(deviceId,clean(input.deviceName(),"말모아 기기"),clean(input.deviceType(),"UNKNOWN"));
        return repository.save(pairing);
    }

    @Transactional(readOnly=true)
    public List<DevicePairing> devices(Long userId){return repository.findByUserIdAndStatusOrderByPairedAtDesc(userId,"CLAIMED");}

    public long remaining(DevicePairing p){return Math.max(0,Duration.between(LocalDateTime.now(),p.getExpiresAt()).getSeconds());}
    private String clean(String value,String fallback){return value==null||value.isBlank()?fallback:value.trim();}
    public record ClaimInput(String deviceId,String deviceName,String deviceType){}
}
