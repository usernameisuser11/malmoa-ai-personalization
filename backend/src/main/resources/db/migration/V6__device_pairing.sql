CREATE TABLE IF NOT EXISTS device_pairings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    pair_code VARCHAR(6) NOT NULL UNIQUE,
    pair_token VARCHAR(80) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    device_id VARCHAR(120),
    device_name VARCHAR(160),
    device_type VARCHAR(30),
    paired_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pairing_user_status ON device_pairings(user_id,status,created_at DESC);
