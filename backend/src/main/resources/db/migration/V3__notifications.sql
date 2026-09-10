CREATE TABLE IF NOT EXISTS guardian_notifications (
    id BIGSERIAL PRIMARY KEY,
    aac_user_id BIGINT NOT NULL,
    aac_user_name VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON guardian_notifications(aac_user_id, created_at DESC);
