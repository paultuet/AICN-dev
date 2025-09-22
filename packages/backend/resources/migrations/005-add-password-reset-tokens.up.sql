-- Add password reset token fields to users table
ALTER TABLE users 
ADD COLUMN reset_token UUID,
ADD COLUMN reset_token_expires_at TIMESTAMP;

-- Create index on reset_token for faster lookups
CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
