-- Update the admin user with the correct Supabase Auth UUID
-- Run this after creating the user in Supabase Auth

-- First, update all foreign key references to the new UUID
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

-- Now update the user record with the correct UUID
UPDATE users 
SET 
    id = '9b84eb25-85a5-48b1-a946-087e3bfbd913', -- Your actual Supabase Auth user ID
    updated_at = NOW()
WHERE email = 'rudvel@gmail.com';
