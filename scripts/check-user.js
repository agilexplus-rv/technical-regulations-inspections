#!/usr/bin/env node

/**
 * Script to check if the test user exists in the database
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

async function checkUser() {
  try {
    console.log('Checking database connection...');
    
    // Check if users table exists and has data
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.error('Error querying users table:', error);
      return;
    }

    console.log('✅ Database connection successful');
    console.log(`Found ${users.length} users in the database:`);
    
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role}) - ID: ${user.id}`);
    });

    // Check specifically for our test user
    const testUser = users.find(u => u.email === 'admin@test.com');
    if (testUser) {
      console.log('\n✅ Test user found:', testUser);
    } else {
      console.log('\n❌ Test user not found');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
checkUser();
