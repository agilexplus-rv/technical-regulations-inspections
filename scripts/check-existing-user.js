const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingUser() {
  try {
    console.log('🔍 Checking for existing user with email: rudvel@gmail.com');
    
    // Check if user exists in database
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'rudvel@gmail.com')
      .single();
    
    if (dbError && dbError.code !== 'PGRST116') {
      console.error('❌ Database error:', dbError.message);
      return;
    }
    
    if (dbUser) {
      console.log('✅ User found in database:');
      console.log('- ID:', dbUser.id);
      console.log('- Name:', `${dbUser.first_name} ${dbUser.last_name}`);
      console.log('- Email:', dbUser.email);
      console.log('- Role:', dbUser.role);
      console.log('- MFA Enabled:', dbUser.mfa_enabled);
      console.log('- Created:', dbUser.created_at);
      console.log('- Last Login:', dbUser.last_login_at || 'Never');
      
      // Check if user exists in Supabase Auth
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(dbUser.id);
        
        if (authError) {
          console.log('\n❌ User not found in Supabase Auth:', authError.message);
          console.log('⚠️  Database and Auth are out of sync!');
        } else {
          console.log('\n✅ User found in Supabase Auth:');
          console.log('- Auth ID:', authUser.user.id);
          console.log('- Email:', authUser.user.email);
          console.log('- Created:', authUser.user.created_at);
        }
      } catch (err) {
        console.log('\n❌ Error checking Supabase Auth:', err.message);
      }
      
    } else {
      console.log('❌ User not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
  }
}

checkExistingUser();
