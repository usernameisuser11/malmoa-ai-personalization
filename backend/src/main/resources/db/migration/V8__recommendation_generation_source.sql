ALTER TABLE recommendation_history
    ADD COLUMN IF NOT EXISTS generation_source VARCHAR(20) NOT NULL DEFAULT 'unknown';

CREATE INDEX IF NOT EXISTS idx_history_user_mode_source
    ON recommendation_history(user_id, mode, generation_source, created_at DESC);
