CREATE TABLE IF NOT EXISTS communication_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    age INTEGER,
    receptive_max_eojeol INTEGER NOT NULL DEFAULT 4,
    expressive_max_eojeol INTEGER NOT NULL DEFAULT 4,
    vocabulary_level VARCHAR(30) NOT NULL DEFAULT 'EASY',
    allow_abstract_language BOOLEAN NOT NULL DEFAULT FALSE,
    allow_causal_expression BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aac_symbols (
    id BIGSERIAL PRIMARY KEY,
    asset_name VARCHAR(120) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    canonical_text VARCHAR(100) NOT NULL,
    default_tts_text VARCHAR(120) NOT NULL,
    color_hex VARCHAR(10) NOT NULL,
    emergency BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_symbol_customizations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    symbol_id BIGINT NOT NULL REFERENCES aac_symbols(id) ON DELETE CASCADE,
    display_text VARCHAR(120),
    tts_text VARCHAR(160),
    user_alias VARCHAR(120),
    custom_image_url TEXT,
    favorite BOOLEAN NOT NULL DEFAULT FALSE,
    important_word BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER,
    CONSTRAINT uq_user_symbol UNIQUE (user_id, symbol_id)
);

CREATE TABLE IF NOT EXISTS word_usage (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    word VARCHAR(120) NOT NULL,
    usage_count BIGINT NOT NULL DEFAULT 0,
    last_used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_word UNIQUE (user_id, word)
);

CREATE TABLE IF NOT EXISTS recommendation_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    situation VARCHAR(100),
    source_intent TEXT,
    generated_sentence TEXT NOT NULL,
    eojeol_count INTEGER NOT NULL,
    personal_word_count INTEGER NOT NULL DEFAULT 0,
    selected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usage_user_count ON word_usage(user_id, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_history_user_created ON recommendation_history(user_id, created_at DESC);
