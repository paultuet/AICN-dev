-- Create table for activity logs (business events tracking)
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    type VARCHAR(50) NOT NULL,
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common query patterns
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX idx_activity_logs_type ON activity_logs(type);
CREATE INDEX idx_activity_logs_user_email ON activity_logs(user_email);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
