#!/usr/bin/env node

/**
 * Script to migrate from custom users table to Supabase Auth user_metadata
 * This eliminates the need for a separate users table and simplifies authentication
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateToAuthMetadata() {
  console.log('🔄 Starting migration to Supabase Auth user_metadata...');

  try {
    // 1. Get all users from custom users table
    const { data: customUsers, error: fetchError } = await supabase
      .from('users')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching custom users:', fetchError);
      return;
    }

    console.log(`📊 Found ${customUsers.length} users to migrate`);

    // 2. Update each user in Supabase Auth with metadata
    for (const user of customUsers) {
      console.log(`🔄 Migrating user: ${user.email}`);

      // Get the auth user by email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Error fetching auth users:', authError);
        continue;
      }

      const authUser = authUsers.users.find(au => au.email === user.email);
      
      if (!authUser) {
        console.log(`⚠️  No auth user found for ${user.email}, skipping...`);
        continue;
      }

      // Update auth user with metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          mfa_enabled: user.mfa_enabled,
          last_login_at: user.last_login_at,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      });

      if (updateError) {
        console.error(`❌ Error updating ${user.email}:`, updateError);
      } else {
        console.log(`✅ Successfully migrated ${user.email}`);
      }
    }

    console.log('🎉 Migration completed!');
    console.log('📝 Next steps:');
    console.log('1. Update your authentication code to use user_metadata');
    console.log('2. Test the application');
    console.log('3. Drop the custom users table if everything works');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration
migrateToAuthMetadata();
