-- Add ban_status field to users table to track deactivated users
ALTER TABLE users ADD COLUMN ban_status BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX idx_users_ban_status ON users(ban_status);

-- Update RLS policies to include ban_status in admin queries
-- The existing policies already allow admins to see all users, so no changes needed there

-- Add a function to get user ban status for easier querying
CREATE OR REPLACE FUNCTION is_user_banned(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT ban_status FROM users WHERE id = user_id);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
