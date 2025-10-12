#!/usr/bin/env node

/**
 * Script to update existing users to store data in Supabase Auth user_metadata
 * This eliminates the need for database queries and simplifies authentication
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

async function updateUsersToMetadata() {
  console.log('🔄 Updating users to use metadata...');

  try {
    // 1. Get all users from custom users table
    const { data: customUsers, error: fetchError } = await supabase
      .from('users')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching custom users:', fetchError);
      return;
    }

    console.log(`📊 Found ${customUsers.length} users to update`);

    // 2. Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log(`📊 Found ${authUsers.users.length} auth users`);

    // 3. Update each auth user with metadata from custom table
    for (const customUser of customUsers) {
      console.log(`🔄 Updating user: ${customUser.email}`);

      // Find matching auth user
      const authUser = authUsers.users.find(au => au.email === customUser.email);
      
      if (!authUser) {
        console.log(`⚠️  No auth user found for ${customUser.email}, skipping...`);
        continue;
      }

      // Check if metadata already exists and is up to date
      const existingMetadata = authUser.user_metadata || {};
      const needsUpdate = 
        existingMetadata.role !== customUser.role ||
        existingMetadata.first_name !== customUser.first_name ||
        existingMetadata.last_name !== customUser.last_name ||
        existingMetadata.mfa_enabled !== customUser.mfa_enabled;

      if (!needsUpdate) {
        console.log(`✅ ${customUser.email} already up to date`);
        continue;
      }

      // Update auth user with metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
        user_metadata: {
          role: customUser.role,
          first_name: customUser.first_name,
          last_name: customUser.last_name,
          mfa_enabled: customUser.mfa_enabled,
          last_login_at: customUser.last_login_at,
          created_at: customUser.created_at,
          updated_at: customUser.updated_at
        }
      });

      if (updateError) {
        console.error(`❌ Error updating ${customUser.email}:`, updateError);
      } else {
        console.log(`✅ Successfully updated ${customUser.email}`);
      }
    }

    console.log('🎉 Update completed!');
    console.log('📝 You can now test the simplified authentication');
    console.log('📝 If everything works, you can drop the custom users table');

  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

// Run update
updateUsersToMetadata();
