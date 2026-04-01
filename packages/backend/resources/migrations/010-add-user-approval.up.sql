ALTER TABLE users ADD COLUMN approved BOOLEAN NOT NULL DEFAULT FALSE;

-- Auto-approve existing verified users
UPDATE users SET approved = TRUE WHERE email_verified = TRUE;
