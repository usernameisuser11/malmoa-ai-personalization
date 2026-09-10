package com.aac.malmoa.symbol;

import com.aac.malmoa.domain.AacSymbol;
import com.aac.malmoa.domain.UserSymbolCustomization;
import com.aac.malmoa.domain.WordUsage;
import com.aac.malmoa.notification.NotificationService;
import com.aac.malmoa.repository.AacSymbolRepository;
import com.aac.malmoa.repository.UserSymbolCustomizationRepository;
import com.aac.malmoa.repository.WordUsageRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users/{userId}")
public class SymbolController {
    private final AacSymbolRepository symbolRepository;
    private final UserSymbolCustomizationRepository customizationRepository;
    private final WordUsageRepository usageRepository;
    private final NotificationService notificationService;

    public SymbolController(AacSymbolRepository symbolRepository,
                            UserSymbolCustomizationRepository customizationRepository,
                            WordUsageRepository usageRepository,
                            NotificationService notificationService) {
        this.symbolRepository = symbolRepository;
        this.customizationRepository = customizationRepository;
        this.usageRepository = usageRepository;
        this.notificationService = notificationService;
    }

    @GetMapping("/symbols")
    @Transactional(readOnly = true)
    public List<SymbolResponse> symbols(@PathVariable Long userId) {
        Map<Long, UserSymbolCustomization> custom = customizationRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(c -> c.getSymbol().getId(), Function.identity()));
        return symbolRepository.findAllByOrderByCategoryAscCanonicalTextAsc().stream()
                .map(s -> SymbolResponse.from(s, custom.get(s.getId())))
                .toList();
    }

    @GetMapping("/emergency-symbols")
    @Transactional(readOnly = true)
    public List<SymbolResponse> emergency(@PathVariable Long userId) {
        Map<Long, UserSymbolCustomization> custom = customizationRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(c -> c.getSymbol().getId(), Function.identity()));
        return symbolRepository.findByEmergencyTrueOrderByIdAsc().stream()
                .map(s -> SymbolResponse.from(s, custom.get(s.getId())))
                .toList();
    }

    @PutMapping("/symbols/{symbolId}")
    @Transactional
    public SymbolResponse customize(@PathVariable Long userId, @PathVariable Long symbolId,
                                    @RequestBody CustomizationRequest request) {
        AacSymbol symbol = symbolRepository.findById(symbolId).orElseThrow();
        UserSymbolCustomization c = customizationRepository.findByUserIdAndSymbolId(userId, symbolId)
                .orElseGet(() -> new UserSymbolCustomization(userId, symbol));
        c.update(request.displayText(), request.ttsText(), request.userAlias(), request.customImageUrl(),
                request.favorite(), request.importantWord(), request.sortOrder());
        return SymbolResponse.from(symbol, customizationRepository.save(c));
    }

    @PostMapping("/usage")
    @Transactional
    public void usage(@PathVariable Long userId, @Valid @RequestBody UsageRequest request) {
        for (String raw : request.words()) {
            if (raw == null || raw.isBlank()) continue;
            String word = raw.trim();
            WordUsage usage = usageRepository.findByUserIdAndWord(userId, word)
                    .orElseGet(() -> new WordUsage(userId, word));
            usage.increment();
            usageRepository.save(usage);
            notificationService.recordIfEmergency(userId, word);
        }
    }

    public record CustomizationRequest(String displayText, String ttsText, String userAlias,
                                       String customImageUrl, boolean favorite, boolean importantWord, Integer sortOrder) {}
    public record UsageRequest(@NotNull List<@NotBlank String> words) {}

    public record SymbolResponse(Long id, String assetName, String category, String canonicalText,
                                 String displayText, String ttsText, String userAlias, String imageUrl,
                                 String colorHex, boolean emergency, boolean favorite, boolean importantWord,
                                 Integer sortOrder) {
        static SymbolResponse from(AacSymbol s, UserSymbolCustomization c) {
            return new SymbolResponse(s.getId(), s.getAssetName(), s.getCategory(), s.getCanonicalText(),
                    c != null && c.getDisplayText() != null ? c.getDisplayText() : s.getCanonicalText(),
                    c != null && c.getTtsText() != null ? c.getTtsText() : s.getDefaultTtsText(),
                    c == null ? null : c.getUserAlias(), c == null ? null : c.getCustomImageUrl(),
                    s.getColorHex(), s.isEmergency(), c != null && c.isFavorite(),
                    c != null && c.isImportantWord(), c == null ? null : c.getSortOrder());
        }
    }
}
