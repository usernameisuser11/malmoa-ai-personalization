package com.aac.malmoa.symbol;

import com.aac.malmoa.domain.AacSymbol;
import com.aac.malmoa.domain.UserSymbolCustomization;
import com.aac.malmoa.domain.WordUsage;
import com.aac.malmoa.notification.NotificationService;
import com.aac.malmoa.repository.AacSymbolRepository;
import com.aac.malmoa.repository.UserSymbolCustomizationRepository;
import com.aac.malmoa.repository.WordUsageRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
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
        requireUserId(userId);
        Map<Long, UserSymbolCustomization> custom = customizationRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(c -> c.getSymbol().getId(), Function.identity()));
        return symbolRepository.findAllByOrderByCategoryAscCanonicalTextAsc().stream()
                .map(symbol -> SymbolResponse.from(symbol, custom.get(symbol.getId())))
                .toList();
    }

    @GetMapping("/emergency-symbols")
    @Transactional(readOnly = true)
    public List<SymbolResponse> emergency(@PathVariable Long userId) {
        requireUserId(userId);
        Map<Long, UserSymbolCustomization> custom = customizationRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(c -> c.getSymbol().getId(), Function.identity()));
        return symbolRepository.findByEmergencyTrueOrderByIdAsc().stream()
                .map(symbol -> SymbolResponse.from(symbol, custom.get(symbol.getId())))
                .toList();
    }

    @PutMapping("/symbols/{symbolId}")
    @Transactional
    public SymbolResponse customize(@PathVariable Long userId, @PathVariable Long symbolId,
                                    @Valid @RequestBody CustomizationRequest request) {
        requireUserId(userId);
        if (symbolId == null || symbolId < 1) throw new IllegalArgumentException("상징 ID를 확인해주세요.");
        AacSymbol symbol = symbolRepository.findById(symbolId).orElseThrow();
        UserSymbolCustomization customization = customizationRepository.findByUserIdAndSymbolId(userId, symbolId)
                .orElseGet(() -> new UserSymbolCustomization(userId, symbol));
        customization.update(request.displayText(), request.ttsText(), request.userAlias(), request.customImageUrl(),
                request.favorite(), request.importantWord(), request.sortOrder());
        return SymbolResponse.from(symbol, customizationRepository.save(customization));
    }

    @PostMapping("/usage")
    @Transactional
    public void usage(@PathVariable Long userId, @Valid @RequestBody UsageRequest request) {
        requireUserId(userId);
        for (String raw : request.words()) {
            String word = raw.trim();
            WordUsage usage = usageRepository.findByUserIdAndWord(userId, word)
                    .orElseGet(() -> new WordUsage(userId, word));
            usage.increment();
            usageRepository.save(usage);
            notificationService.recordIfEmergency(userId, word);
        }
    }

    private void requireUserId(Long userId) {
        if (userId == null || userId < 1) throw new IllegalArgumentException("사용자 ID를 확인해주세요.");
    }

    public record CustomizationRequest(
            @Size(max = 80) String displayText,
            @Size(max = 160) String ttsText,
            @Size(max = 80) String userAlias,
            @Size(max = 500000) String customImageUrl,
            boolean favorite,
            boolean importantWord,
            @Min(0) @Max(9999) Integer sortOrder) {}

    public record UsageRequest(
            @NotNull @Size(min = 1, max = 50)
            List<@NotBlank @Size(max = 100) String> words) {}

    public record SymbolResponse(Long id, String assetName, String category, String canonicalText,
                                 String displayText, String ttsText, String userAlias, String imageUrl,
                                 String colorHex, boolean emergency, boolean favorite, boolean importantWord,
                                 Integer sortOrder) {
        static SymbolResponse from(AacSymbol symbol, UserSymbolCustomization customization) {
            return new SymbolResponse(symbol.getId(), symbol.getAssetName(), symbol.getCategory(), symbol.getCanonicalText(),
                    customization != null && customization.getDisplayText() != null ? customization.getDisplayText() : symbol.getCanonicalText(),
                    customization != null && customization.getTtsText() != null ? customization.getTtsText() : symbol.getDefaultTtsText(),
                    customization == null ? null : customization.getUserAlias(), customization == null ? null : customization.getCustomImageUrl(),
                    symbol.getColorHex(), symbol.isEmergency(), customization != null && customization.isFavorite(),
                    customization != null && customization.isImportantWord(), customization == null ? null : customization.getSortOrder());
        }
    }
}
