-- Cloudflare D1 Database Schema

CREATE TABLE IF NOT EXISTS user_data (
    user_id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_data_updated ON user_data(updated_at);
