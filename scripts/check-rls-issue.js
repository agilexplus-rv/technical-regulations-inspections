const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSIssue() {
  try {
    console.log('🔍 Checking RLS issue...');
    
    // Test 1: Check if RLS is enabled on users table
    console.log('\n📊 Test 1: Checking RLS status...');
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('exec_sql', {
        sql_query: "SELECT relrowsecurity FROM pg_class WHERE relname = 'users';"
      });
    
    if (rlsError) {
      console.log('⚠️  Cannot check RLS status:', rlsError.message);
    } else {
      console.log('RLS Status:', rlsData);
    }
    
    // Test 2: Try to disable RLS temporarily
    console.log('\n📊 Test 2: Temporarily disabling RLS...');
    const { error: disableError } = await supabase
      .rpc('exec_sql', {
        sql_query: "ALTER TABLE users DISABLE ROW LEVEL SECURITY;"
      });
    
    if (disableError) {
      console.log('⚠️  Cannot disable RLS:', disableError.message);
    } else {
      console.log('✅ RLS disabled');
      
      // Now try the query
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'rudvel@gmail.com')
        .single();
      
      if (usersError) {
        console.error('❌ Query still failed after disabling RLS:', usersError.message);
      } else {
        console.log('✅ Query succeeded after disabling RLS:', users);
      }
      
      // Re-enable RLS
      const { error: enableError } = await supabase
        .rpc('exec_sql', {
          sql_query: "ALTER TABLE users ENABLE ROW LEVEL SECURITY;"
        });
      
      if (enableError) {
        console.log('⚠️  Could not re-enable RLS:', enableError.message);
      } else {
        console.log('✅ RLS re-enabled');
      }
    }
    
    // Test 3: Check if there's a different issue
    console.log('\n📊 Test 3: Direct SQL query...');
    const { data: sqlData, error: sqlError } = await supabase
      .rpc('exec_sql', {
        sql_query: "SELECT * FROM users WHERE email = 'rudvel@gmail.com';"
      });
    
    if (sqlError) {
      console.log('⚠️  Direct SQL failed:', sqlError.message);
    } else {
      console.log('✅ Direct SQL succeeded:', sqlData);
    }
    
  } catch (error) {
    console.error('❌ Error checking RLS issue:', error);
  }
}

checkRLSIssue();
