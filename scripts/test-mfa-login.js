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

const testMFALogin = async () => {
  try {
    console.log('🧪 Testing MFA login flow...');

    // First, let's check the user details
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
      role: user.role,
      mfa_enabled: user.mfa_enabled
    });

    // Test the isMFAEnabled function logic
    console.log('\n🧪 Testing MFA detection logic...');
    const mfaEnabled = user.mfa_enabled;
    console.log('MFA enabled status:', mfaEnabled);

    if (mfaEnabled) {
      console.log('✅ User has MFA enabled - should trigger MFA flow');
      
      // Test generating an MFA token
      console.log('\n🧪 Testing MFA token generation...');
      const otp = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      console.log('Generated OTP:', otp);
      
      // Test storing MFA session
      console.log('\n🧪 Testing MFA session storage...');
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
      
      const { error: storeError } = await supabase
        .from('mfa_sessions')
        .insert({
          user_id: user.id,
          token: otp,
          expires_at: expiresAt.toISOString(),
          ip_address: '127.0.0.1',
          user_agent: 'test-script'
        });
        
      if (storeError) {
        console.error('❌ Error storing MFA session:', storeError.message);
      } else {
        console.log('✅ MFA session stored successfully');
        
        // Test verifying the token
        console.log('\n🧪 Testing MFA token verification...');
        const { data: sessionData, error: verifyError } = await supabase
          .from('mfa_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('token', otp)
          .gt('expires_at', new Date().toISOString())
          .is('used_at', null)
          .single();
          
        if (verifyError) {
          console.error('❌ Error verifying MFA token:', verifyError.message);
        } else {
          console.log('✅ MFA token verification successful');
          console.log('Session data:', sessionData);
        }
      }
    } else {
      console.log('❌ User does not have MFA enabled');
    }

  } catch (error) {
    console.error('❌ Error in MFA test:', error.message);
  }
};

testMFALogin();
