const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUserMismatch() {
  try {
    console.log('🔍 Debugging user mismatch for rudvel@gmail.com');
    
    // Check database
    console.log('\n📊 Database check:');
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'rudvel@gmail.com')
      .single();
    
    if (dbError && dbError.code !== 'PGRST116') {
      console.error('❌ Database error:', dbError.message);
    } else if (dbUser) {
      console.log('✅ Database user found:');
      console.log('- ID:', dbUser.id);
      console.log('- Name:', `${dbUser.first_name} ${dbUser.last_name}`);
      console.log('- Email:', dbUser.email);
      console.log('- Role:', dbUser.role);
    } else {
      console.log('❌ No user found in database');
    }
    
    // Check Supabase Auth
    console.log('\n📊 Supabase Auth check:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
    } else {
      const authUser = authUsers.users.find(u => u.email === 'rudvel@gmail.com');
      if (authUser) {
        console.log('✅ Auth user found:');
        console.log('- ID:', authUser.id);
        console.log('- Email:', authUser.email);
        console.log('- Created:', authUser.created_at);
        console.log('- Metadata:', authUser.user_metadata);
      } else {
        console.log('❌ No user found in Supabase Auth');
      }
    }
    
    // Check if IDs match
    if (dbUser && authUser) {
      console.log('\n🔍 ID Comparison:');
      console.log('- Database ID:', dbUser.id);
      console.log('- Auth ID:', authUser.id);
      console.log('- IDs Match:', dbUser.id === authUser.id ? '✅ Yes' : '❌ No');
      
      if (dbUser.id !== authUser.id) {
        console.log('\n⚠️  MISMATCH DETECTED!');
        console.log('The user exists in both systems but with different IDs.');
        console.log('This is why the login shows "Test Admin" - the database query fails.');
        console.log('\n💡 Solution: Update the database to use the correct Auth ID');
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging user mismatch:', error);
  }
}

debugUserMismatch();
