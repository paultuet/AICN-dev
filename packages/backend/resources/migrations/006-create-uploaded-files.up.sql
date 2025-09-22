-- Create table for uploaded files
CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    version VARCHAR(50) NOT NULL,
    upload_date DATE NOT NULL,
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster queries
CREATE INDEX idx_uploaded_files_created_at ON uploaded_files(created_at DESC);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_uploaded_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_uploaded_files_updated_at BEFORE UPDATE
    ON uploaded_files FOR EACH ROW EXECUTE FUNCTION update_uploaded_files_updated_at();