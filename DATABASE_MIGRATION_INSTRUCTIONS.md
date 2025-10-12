# Database Migration Instructions - User Ban Status

## Overview
To complete the user deactivation feature, you need to manually run a database migration to add the `ban_status` column to the `users` table.

## Steps to Complete the Migration

### 1. Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** tab

### 2. Run the Migration SQL
Copy and paste the following SQL into the SQL Editor and execute it:

```sql
-- Add ban_status field to users table to track deactivated users
ALTER TABLE users ADD COLUMN ban_status BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_ban_status ON users(ban_status);

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
```

### 3. Verify the Migration
After running the SQL, verify that:
1. The `ban_status` column was added to the `users` table
2. The index `idx_users_ban_status` was created
3. The function `is_user_banned` was created

You can verify by running:
```sql
-- Check if column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'ban_status';

-- Check if index exists
SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_ban_status';

-- Check if function exists
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'is_user_banned';
```

## What This Migration Does

1. **Adds `ban_status` column**: A boolean field that tracks whether a user is deactivated
2. **Creates an index**: Improves query performance when filtering by ban status
3. **Creates a helper function**: `is_user_banned()` for easy status checking

## After Migration

Once the migration is complete, the user management interface will:
- Show a "Deactivated" badge for banned users
- Grey out Edit and Reset Password buttons for deactivated users
- Change the Deactivate button to a "Reactivate" button for deactivated users
- Keep the Delete button unchanged (as requested)

## Testing

After running the migration:
1. Go to the User Management page in your application
2. Deactivate a test user
3. Verify that the UI changes are reflected (badge, greyed buttons, reactivate button)
4. Test reactivating the user to ensure it works properly

## Troubleshooting

If you encounter any issues:
1. Make sure you're running the SQL in the correct Supabase project
2. Ensure you have admin privileges on the database
3. Check that the `users` table exists before running the migration
4. If the column already exists, you'll get an error - this is normal and can be ignored

## Files Modified

The following files have been updated to support the ban status feature:
- `src/components/settings/user-management.tsx` - UI changes
- `src/lib/server-actions/settings.ts` - Server actions for deactivate/reactivate
- `supabase/migrations/006_add_user_ban_status.sql` - Database migration
