-- Cleanup script to remove existing admin user and recreate
-- Only run this if you want to start fresh

-- Delete all data that references the old user ID
DELETE FROM checklists WHERE created_by = '00000000-0000-0000-0000-000000000001';
DELETE FROM inspections WHERE created_by = '00000000-0000-0000-0000-000000000001';
DELETE FROM findings WHERE drafted_by = '00000000-0000-0000-0000-000000000001';
DELETE FROM notices WHERE drafted_by_officer_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';

-- Now you can run the original seed file again with the correct UUID
