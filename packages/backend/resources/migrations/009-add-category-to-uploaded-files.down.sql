-- Remove category column from uploaded_files table
DROP INDEX IF EXISTS idx_uploaded_files_category;
ALTER TABLE uploaded_files DROP COLUMN IF EXISTS category;
