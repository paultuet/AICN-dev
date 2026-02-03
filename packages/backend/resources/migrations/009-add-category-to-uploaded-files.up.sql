-- Add category column to uploaded_files table
ALTER TABLE uploaded_files ADD COLUMN category VARCHAR(100);

-- Create index for faster category lookups
CREATE INDEX idx_uploaded_files_category ON uploaded_files(category);
