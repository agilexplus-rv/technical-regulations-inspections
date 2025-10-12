-- Add session_data column to mfa_sessions table
ALTER TABLE mfa_sessions 
ADD COLUMN session_data TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN mfa_sessions.session_data IS 'Temporary storage for session tokens during MFA flow';
