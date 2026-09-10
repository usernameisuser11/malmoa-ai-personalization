INSERT INTO aac_symbols(asset_name, category, canonical_text, default_tts_text, color_hex, emergency) VALUES
('ic_emergency_breath','긴급어','숨쉬기 힘들어요','숨쉬기 힘들어요','#FF8587',TRUE),
('ic_emergency_danger','긴급어','위험해요','위험해요','#FF8587',TRUE),
('ic_emergency_fall','긴급어','넘어졌어요','넘어졌어요','#FF8587',TRUE),
('ic_emergency_guardian','긴급어','보호자에게 연락해주세요','보호자에게 연락해주세요','#FF8587',TRUE)
ON CONFLICT (asset_name) DO NOTHING;
