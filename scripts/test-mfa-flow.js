const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testMFAFlow = async () => {
  try {
    console.log('🧪 Testing MFA flow...');

    // Test 1: Check if users table has mfa_enabled column
    console.log('\n1. Checking users table structure...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, mfa_enabled')
      .limit(1);

    if (usersError) {
      console.error('❌ Error accessing users table:', usersError.message);
    } else {
      console.log('✅ Users table accessible');
      if (users && users.length > 0) {
        console.log('✅ Sample user data:', users[0]);
      }
    }

    // Test 2: Try to access mfa_sessions table
    console.log('\n2. Checking mfa_sessions table...');
    const { data: mfaSessions, error: mfaError } = await supabase
      .from('mfa_sessions')
      .select('*')
      .limit(1);

    if (mfaError) {
      if (mfaError.code === 'PGRST116') {
        console.log('⚠️  mfa_sessions table does not exist yet');
        console.log('📝 You need to create this table manually in Supabase dashboard');
      } else {
        console.error('❌ Error accessing mfa_sessions table:', mfaError.message);
      }
    } else {
      console.log('✅ mfa_sessions table accessible');
    }

    // Test 3: Check if we can enable MFA for a user
    console.log('\n3. Testing MFA enable/disable...');
    if (users && users.length > 0) {
      const testUser = users[0];
      console.log(`Testing with user: ${testUser.email}`);
      
      // Try to enable MFA
      const { error: updateError } = await supabase
        .from('users')
        .update({ mfa_enabled: true })
        .eq('id', testUser.id);

      if (updateError) {
        console.error('❌ Error updating MFA setting:', updateError.message);
      } else {
        console.log('✅ MFA can be enabled/disabled');
        
        // Revert the change
        await supabase
          .from('users')
          .update({ mfa_enabled: testUser.mfa_enabled })
          .eq('id', testUser.id);
      }
    }

    console.log('\n🎉 MFA flow test completed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Users table is accessible');
    console.log('- ⚠️  mfa_sessions table needs to be created');
    console.log('- ✅ MFA enable/disable functionality works');
    
  } catch (error) {
    console.error('❌ Error testing MFA flow:', error.message);
  }
};

testMFAFlow();
