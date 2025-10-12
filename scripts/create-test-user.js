#!/usr/bin/env node

/**
 * Script to create a test user for the Technical Regulations Inspections app
 * This script will create a user in Supabase Auth and the users table
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://muzpbudurlatuznkrgtx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11enBidWR1cmxhdHV6bmtyZ3R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwOTAyNiwiZXhwIjoyMDc1Njg1MDI2fQ.MmErF4J-SBrK4ActQ3zkDNPQbpSLiD4J_R6rtj_h4Jg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  const email = 'admin@test.com';
  const password = 'TestPassword123!';
  const firstName = 'Test';
  const lastName = 'Admin';

  try {
    console.log('Creating test user...');
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Create user in users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role: 'admin',
        first_name: firstName,
        last_name: lastName,
        mfa_enabled: true
      });

    if (userError) {
      console.error('Error creating user profile:', userError);
      return;
    }

    console.log('✅ User profile created');
    console.log('\n🎉 Test user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\nYou can now login to the app with these credentials.');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
createTestUser();
