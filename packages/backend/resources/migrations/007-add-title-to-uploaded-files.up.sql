-- Add title column to uploaded_files table
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS title VARCHAR(255);
