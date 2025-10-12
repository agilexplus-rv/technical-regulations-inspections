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

const addBanStatusColumn = async () => {
  try {
    console.log('🔧 Adding ban_status column to users table...');
    
    // First, let's check if the column already exists by trying to query it
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('ban_status')
      .limit(1);
    
    if (testError && testError.message.includes('column "ban_status" does not exist')) {
      console.log('Column does not exist, attempting to add it...');
      
      // Since we can't execute DDL directly, let's use a workaround
      // We'll try to insert a record with the ban_status field to see if it works
      console.log('⚠️  Direct SQL execution not available through client');
      console.log('📋 MANUAL STEPS REQUIRED:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the following SQL:');
      console.log('');
      console.log('ALTER TABLE users ADD COLUMN ban_status BOOLEAN DEFAULT FALSE;');
      console.log('CREATE INDEX IF NOT EXISTS idx_users_ban_status ON users(ban_status);');
      console.log('');
      console.log('CREATE OR REPLACE FUNCTION is_user_banned(user_id UUID)');
      console.log('RETURNS BOOLEAN AS $$');
      console.log('BEGIN');
      console.log('    RETURN (SELECT ban_status FROM users WHERE id = user_id);');
      console.log('EXCEPTION');
      console.log('    WHEN NO_DATA_FOUND THEN');
      console.log('        RETURN FALSE;');
      console.log('END;');
      console.log('$$ LANGUAGE plpgsql SECURITY DEFINER;');
      console.log('');
      
    } else if (!testError) {
      console.log('✅ Column ban_status already exists!');
      
      // Test the function
      const { data: functionTest, error: functionError } = await supabase
        .rpc('is_user_banned', { user_id: '00000000-0000-0000-0000-000000000000' });
      
      if (functionError) {
        console.log('⚠️  Function is_user_banned might not exist');
        console.log('Please run the CREATE FUNCTION statement manually in SQL Editor');
      } else {
        console.log('✅ Function is_user_banned exists and working');
      }
    } else {
      console.error('❌ Unexpected error:', testError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

addBanStatusColumn().then(() => {
  console.log('\n🎉 Script completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
