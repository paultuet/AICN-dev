-- Drop trigger and function
DROP TRIGGER IF EXISTS update_uploaded_files_updated_at ON uploaded_files;
DROP FUNCTION IF EXISTS update_uploaded_files_updated_at();

-- Drop index
DROP INDEX IF EXISTS idx_uploaded_files_created_at;

-- Drop table
DROP TABLE IF EXISTS uploaded_files;