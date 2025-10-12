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

const testIsMFAEnabled = async () => {
  try {
    console.log('🧪 Testing isMFAEnabled function logic...');

    const userId = '63806f89-a6fb-491e-9966-d28e7c1ed423'; // rudie.vella@outlook.com
    
    // Test with admin client (what we're now using)
    console.log('\n🔍 Testing with admin client...');
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .select('mfa_enabled')
      .eq('id', userId)
      .single();

    if (adminError) {
      console.error('❌ Admin client error:', adminError.message);
    } else {
      console.log('✅ Admin client result:', adminData);
      console.log('MFA enabled:', adminData.mfa_enabled);
    }

    // Test with regular client
    console.log('\n🔍 Testing with regular client...');
    const regularSupabase = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: regularData, error: regularError } = await regularSupabase
      .from('users')
      .select('mfa_enabled')
      .eq('id', userId)
      .single();

    if (regularError) {
      console.error('❌ Regular client error:', regularError.message);
    } else {
      console.log('✅ Regular client result:', regularData);
    }

  } catch (error) {
    console.error('❌ Error in test:', error.message);
  }
};

testIsMFAEnabled();
