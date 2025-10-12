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

const resetPassword = async () => {
  try {
    console.log('🔧 Resetting password for rudie.vella@outlook.com...');

    // Find the user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'rudie.vella@outlook.com')
      .single();

    if (userError) {
      console.error('❌ Error finding user:', userError.message);
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      mfa_enabled: user.mfa_enabled
    });

    // Reset password using Supabase Admin API
    const newPassword = 'Test123!';
    const { error: resetError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword
    });

    if (resetError) {
      console.error('❌ Error resetting password:', resetError.message);
      return;
    }

    console.log('✅ Password reset successfully!');
    console.log('📧 Email: rudie.vella@outlook.com');
    console.log('🔑 New Password: Test123!');
    console.log('🔐 MFA Enabled: true');

  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
  }
};

resetPassword();
