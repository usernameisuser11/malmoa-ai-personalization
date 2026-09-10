package com.aac.malmoa.notification;

import com.aac.malmoa.domain.AacSymbol;
import com.aac.malmoa.domain.GuardianNotification;
import com.aac.malmoa.domain.UserSymbolCustomization;
import com.aac.malmoa.repository.AacSymbolRepository;
import com.aac.malmoa.repository.GuardianNotificationRepository;
import com.aac.malmoa.repository.UserSymbolCustomizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationService {
    private final AacSymbolRepository symbolRepository;
    private final UserSymbolCustomizationRepository customizationRepository;
    private final GuardianNotificationRepository notificationRepository;

    public NotificationService(AacSymbolRepository symbolRepository,
                               UserSymbolCustomizationRepository customizationRepository,
                               GuardianNotificationRepository notificationRepository) {
        this.symbolRepository = symbolRepository;
        this.customizationRepository = customizationRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void recordIfEmergency(Long userId, String usedWord) {
        if (usedWord == null || usedWord.isBlank()) return;
        String normalized = usedWord.trim();
        List<AacSymbol> emergency = symbolRepository.findByEmergencyTrueOrderByIdAsc();
        for (AacSymbol symbol : emergency) {
            UserSymbolCustomization custom = customizationRepository.findByUserIdAndSymbolId(userId, symbol.getId()).orElse(null);
            boolean match = normalized.equals(symbol.getCanonicalText())
                    || (custom != null && normalized.equals(custom.getDisplayText()))
                    || (custom != null && normalized.equals(custom.getUserAlias()));
            if (match) {
                String shown = custom != null && custom.getDisplayText() != null ? custom.getDisplayText() : symbol.getCanonicalText();
                String message = "사용자님이 긴급 상징 \"" + shown + "\"을(를) 사용했습니다.";
                notificationRepository.save(new GuardianNotification(userId, "사용자", message));
                return;
            }
        }
    }
}
