-- Create a new admin user
-- This script will create a new admin user in the database
-- You'll need to create the corresponding Supabase Auth user manually

-- Insert new admin user (replace with your preferred email)
INSERT INTO users (
    id,
    email,
    role,
    first_name,
    last_name,
    mfa_enabled,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000999', -- Temporary UUID - replace with actual Supabase Auth user ID
    'admin@example.com', -- Replace with your email
    'admin',
    'New',
    'Admin',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    first_name = 'New',
    last_name = 'Admin',
    mfa_enabled = true,
    updated_at = NOW();

-- Note: After running this script, you'll need to:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create a new user with the email you specified above
-- 3. Copy the user ID from Supabase Auth and update the users table
-- 4. Set a password for the new user in Supabase Auth
