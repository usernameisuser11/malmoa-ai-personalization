CREATE TABLE IF NOT EXISTS aac_user_settings (
    user_id BIGINT PRIMARY KEY,
    name VARCHAR(120) NOT NULL DEFAULT '사용자',
    birth_date DATE,
    relationship_type VARCHAR(30) DEFAULT 'PARENT',
    emergency_contact VARCHAR(40),
    grid_size VARCHAR(20) NOT NULL DEFAULT 'GRID_3X3',
    voice_type VARCHAR(30) NOT NULL DEFAULT 'CHILD_MALE',
    speech_rate DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO aac_user_settings(user_id, name, birth_date, relationship_type, emergency_contact, grid_size, voice_type, speech_rate)
VALUES (1, '민준', '2016-03-14', 'PARENT', NULL, 'GRID_3X3', 'CHILD_MALE', 1.0)
ON CONFLICT (user_id) DO NOTHING;
