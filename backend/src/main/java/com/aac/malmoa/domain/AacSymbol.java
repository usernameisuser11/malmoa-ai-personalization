package com.aac.malmoa.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "aac_symbols")
public class AacSymbol {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "asset_name", nullable = false, unique = true)
    private String assetName;
    @Column(nullable = false)
    private String category;
    @Column(name = "canonical_text", nullable = false)
    private String canonicalText;
    @Column(name = "default_tts_text", nullable = false)
    private String defaultTtsText;
    @Column(name = "color_hex", nullable = false)
    private String colorHex;
    @Column(nullable = false)
    private boolean emergency;

    protected AacSymbol() {}
    public Long getId() { return id; }
    public String getAssetName() { return assetName; }
    public String getCategory() { return category; }
    public String getCanonicalText() { return canonicalText; }
    public String getDefaultTtsText() { return defaultTtsText; }
    public String getColorHex() { return colorHex; }
    public boolean isEmergency() { return emergency; }
}
