const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  try {
    console.log('🔍 Checking RLS policies on users table...');
    
    // Check if RLS is enabled
    const { data: rlsEnabled, error: rlsError } = await supabase
      .rpc('exec_sql', {
        sql_query: "SELECT relrowsecurity FROM pg_class WHERE relname = 'users';"
      });
    
    if (rlsError) {
      console.log('⚠️  Could not check RLS status, trying alternative...');
      
      // Alternative: Check policies directly
      const { data: policies, error: policiesError } = await supabase
        .rpc('exec_sql', {
          sql_query: `
            SELECT 
              schemaname,
              tablename,
              policyname,
              permissive,
              roles,
              cmd,
              qual,
              with_check
            FROM pg_policies 
            WHERE tablename = 'users';
          `
        });
      
      if (policiesError) {
        console.log('⚠️  Could not check policies:', policiesError.message);
      } else {
        console.log('📋 RLS Policies on users table:');
        if (policies && policies.length > 0) {
          policies.forEach(policy => {
            console.log(`- Policy: ${policy.policyname}`);
            console.log(`  Command: ${policy.cmd}`);
            console.log(`  Roles: ${policy.roles}`);
            console.log(`  Condition: ${policy.qual}`);
            console.log('');
          });
        } else {
          console.log('✅ No RLS policies found on users table');
        }
      }
    } else {
      console.log('RLS Status:', rlsEnabled);
    }
    
    // Test client-side access (simulate what the frontend does)
    console.log('\n🔍 Testing client-side access...');
    
    // Create a client with anon key (like the frontend)
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    console.log('Testing with anon key...');
    const { data: anonData, error: anonError } = await anonSupabase
      .from('users')
      .select('*')
      .eq('email', 'rudvel@gmail.com')
      .single();
    
    if (anonError) {
      console.error('❌ Anon key query failed:', anonError);
    } else {
      console.log('✅ Anon key query succeeded:', anonData);
    }
    
  } catch (error) {
    console.error('❌ Error checking RLS policies:', error);
  }
}

checkRLSPolicies();
