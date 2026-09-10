package com.aac.malmoa.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "user_symbol_customizations", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "symbol_id"}))
public class UserSymbolCustomization {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "symbol_id")
    private AacSymbol symbol;
    @Column(name = "display_text")
    private String displayText;
    @Column(name = "tts_text")
    private String ttsText;
    @Column(name = "user_alias")
    private String userAlias;
    @Column(name = "custom_image_url")
    private String customImageUrl;
    @Column(nullable = false)
    private boolean favorite;
    @Column(name = "important_word", nullable = false)
    private boolean importantWord;
    @Column(name = "sort_order")
    private Integer sortOrder;

    protected UserSymbolCustomization() {}
    public UserSymbolCustomization(Long userId, AacSymbol symbol) { this.userId = userId; this.symbol = symbol; }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public AacSymbol getSymbol() { return symbol; }
    public String getDisplayText() { return displayText; }
    public String getTtsText() { return ttsText; }
    public String getUserAlias() { return userAlias; }
    public String getCustomImageUrl() { return customImageUrl; }
    public boolean isFavorite() { return favorite; }
    public boolean isImportantWord() { return importantWord; }
    public Integer getSortOrder() { return sortOrder; }

    public void update(String displayText, String ttsText, String userAlias, String customImageUrl,
                       boolean favorite, boolean importantWord, Integer sortOrder) {
        this.displayText = blankToNull(displayText);
        this.ttsText = blankToNull(ttsText);
        this.userAlias = blankToNull(userAlias);
        this.customImageUrl = blankToNull(customImageUrl);
        this.favorite = favorite;
        this.importantWord = importantWord;
        this.sortOrder = sortOrder;
    }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
