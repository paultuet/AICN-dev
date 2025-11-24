-- Drop indexes
DROP INDEX IF EXISTS idx_activity_logs_timestamp;
DROP INDEX IF EXISTS idx_activity_logs_type;
DROP INDEX IF EXISTS idx_activity_logs_user_email;
DROP INDEX IF EXISTS idx_activity_logs_created_at;

-- Drop table
DROP TABLE IF EXISTS activity_logs;
