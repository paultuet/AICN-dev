-- Remove title column from uploaded_files table
ALTER TABLE uploaded_files DROP COLUMN IF EXISTS title;
