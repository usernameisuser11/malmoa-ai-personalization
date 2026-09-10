ALTER TABLE recommendation_history ADD COLUMN IF NOT EXISTS mode VARCHAR(30) NOT NULL DEFAULT 'personalized';
CREATE INDEX IF NOT EXISTS idx_history_user_mode_created ON recommendation_history(user_id, mode, created_at DESC);
