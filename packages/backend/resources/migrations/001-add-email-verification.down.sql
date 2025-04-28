-- Remove email verification fields from users table
DROP INDEX IF EXISTS idx_users_verification_token;
ALTER TABLE public.users
DROP COLUMN email_verified,
DROP COLUMN verification_token,
DROP COLUMN verification_token_expires_at;