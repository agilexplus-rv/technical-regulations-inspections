const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserQuery() {
  try {
    console.log('🔍 Testing user queries...');
    
    // Test 1: Query by ID
    console.log('\n📊 Test 1: Query by ID (5aec4421-316b-4cb8-93e3-79bc3742d4ee)');
    const { data: userById, error: errorById } = await supabase
      .from('users')
      .select('*')
      .eq('id', '5aec4421-316b-4cb8-93e3-79bc3742d4ee')
      .single();
    
    if (errorById) {
      console.error('❌ Error querying by ID:', errorById);
    } else {
      console.log('✅ User found by ID:', userById);
    }
    
    // Test 2: Query by email
    console.log('\n📊 Test 2: Query by email (rudvel@gmail.com)');
    const { data: userByEmail, error: errorByEmail } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'rudvel@gmail.com')
      .single();
    
    if (errorByEmail) {
      console.error('❌ Error querying by email:', errorByEmail);
    } else {
      console.log('✅ User found by email:', userByEmail);
    }
    
    // Test 3: List all users
    console.log('\n📊 Test 3: List all users');
    const { data: allUsers, error: errorAll } = await supabase
      .from('users')
      .select('*');
    
    if (errorAll) {
      console.error('❌ Error listing users:', errorAll);
    } else {
      console.log(`✅ Found ${allUsers.length} users:`, allUsers.map(u => ({ id: u.id, email: u.email, name: `${u.first_name} ${u.last_name}` })));
    }
    
    // Test 4: Check RLS policies
    console.log('\n📊 Test 4: Checking RLS policies');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'users' });
    
    if (policiesError) {
      console.log('⚠️  Could not check RLS policies:', policiesError.message);
    } else {
      console.log('📋 RLS Policies:', policies);
    }
    
  } catch (error) {
    console.error('❌ Error testing user query:', error);
  }
}

testUserQuery();
