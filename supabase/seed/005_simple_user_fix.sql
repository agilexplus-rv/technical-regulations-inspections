-- Simple approach to fix the user UUID issue
-- This script will work by using a different strategy

-- Step 1: Temporarily disable foreign key constraints for this session
SET session_replication_role = replica;

-- Step 2: Delete the existing user record with the wrong UUID
DELETE FROM users WHERE email = 'rudvel@gmail.com';

-- Step 3: Insert the user record with the correct UUID
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
    '9b84eb25-85a5-48b1-a946-087e3bfbd913', -- Your actual Supabase Auth user ID
    'rudvel@gmail.com',
    'admin',
    'Admin',
    'User',
    true,
    NOW(),
    NOW()
);

-- Step 4: Update all foreign key references to point to the correct UUID
UPDATE checklists 
SET created_by = '9b84eb25-85a5-48b1-a946-087e3bfbd913',
    published_by = '9b84eb25-85a5-48b1-a946-087e3bfbd913',
    updated_at = NOW()
WHERE created_by = '00000000-0000-0000-0000-000000000001' 
   OR published_by = '00000000-0000-0000-0000-000000000001';

-- Update any other tables that might reference the user
UPDATE inspections 
SET created_by = '9b84eb25-85a5-48b1-a946-087e3bfbd913',
    assigned_to = '9b84eb25-85a5-48b1-a946-087e3bfbd913',
    updated_at = NOW()
WHERE created_by = '00000000-0000-0000-0000-000000000001' 
   OR assigned_to = '00000000-0000-0000-0000-000000000001';

UPDATE findings 
SET drafted_by = '9b84eb25-85a5-48b1-a946-087e3bfbd913',
    approved_by_officer_id = '9b84eb25-85a5-48b1-a946-087e3bfbd913',
    approved_by_manager_id = '9b84eb25-85a5-48b1-a946-087e3bfbd913',
    updated_at = NOW()
WHERE drafted_by = '00000000-0000-0000-0000-000000000001' 
   OR approved_by_officer_id = '00000000-0000-0000-0000-000000000001'
   OR approved_by_manager_id = '00000000-0000-0000-0000-000000000001';

UPDATE notices 
SET drafted_by_officer_id = '9b84eb25-85a5-48b1-a946-087e3bfbd913',
    signed_by_manager_id = '9b84eb25-85a5-48b1-a946-087e3bfbd913',
    updated_at = NOW()
WHERE drafted_by_officer_id = '00000000-0000-0000-0000-000000000001' 
   OR signed_by_manager_id = '00000000-0000-0000-0000-000000000001';

-- Step 5: Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Step 6: Verify the fix worked
-- SELECT id, email, role, first_name, last_name FROM users WHERE email = 'rudvel@gmail.com';
