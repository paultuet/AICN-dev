-- Drop password reset token fields from users table
DROP INDEX IF EXISTS idx_users_reset_token;
ALTER TABLE users 
DROP COLUMN IF EXISTS reset_token,
DROP COLUMN IF EXISTS reset_token_expires_at;