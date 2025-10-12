-- Create MFA sessions table for temporary 2FA codes
CREATE TABLE mfa_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token VARCHAR(10) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT
);

-- Create index for faster lookups
CREATE INDEX idx_mfa_sessions_user_id ON mfa_sessions(user_id);
CREATE INDEX idx_mfa_sessions_token ON mfa_sessions(token);
CREATE INDEX idx_mfa_sessions_expires_at ON mfa_sessions(expires_at);

-- RLS policies for mfa_sessions table
ALTER TABLE mfa_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own MFA sessions
CREATE POLICY "Users can view own MFA sessions" ON mfa_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own MFA sessions
CREATE POLICY "Users can insert own MFA sessions" ON mfa_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own MFA sessions (for marking as used)
CREATE POLICY "Users can update own MFA sessions" ON mfa_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to clean up expired MFA sessions
CREATE OR REPLACE FUNCTION cleanup_expired_mfa_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM mfa_sessions 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired sessions (if pg_cron is available)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-mfa-sessions', '*/5 * * * *', 'SELECT cleanup_expired_mfa_sessions();');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON mfa_sessions TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_mfa_sessions() TO authenticated;
