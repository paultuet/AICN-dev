-- Add email verification fields to users table
ALTER TABLE public.users
ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN verification_token UUID NULL,
ADD COLUMN verification_token_expires_at TIMESTAMP WITH TIME ZONE NULL;

-- Create index for faster token lookup
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON public.users(verification_token);

-- Update existing users to have verified emails
UPDATE public.users SET email_verified = TRUE;