ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS font_size text DEFAULT 'medium';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS chat_density text DEFAULT 'comfortable';