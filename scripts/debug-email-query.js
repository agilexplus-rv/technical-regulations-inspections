const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugEmailQuery() {
  try {
    console.log('🔍 Debugging email query...');
    
    // Sign in as the user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'rudvel@gmail.com',
      password: 'Rudie123!'
    });
    
    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }
    
    console.log('✅ Signed in as:', signInData.user.email);
    console.log('Auth user ID:', signInData.user.id);
    
    // Check what's in the users table
    console.log('\n📊 All users in database:');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*');
    
    if (allUsersError) {
      console.error('❌ Error getting all users:', allUsersError.message);
    } else {
      allUsers.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.first_name} ${user.last_name}`);
      });
    }
    
    // Try the email query
    console.log('\n📊 Testing email query...');
    const { data: emailUser, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'rudvel@gmail.com')
      .single();
    
    console.log('Email query result:', {
      found: !!emailUser,
      error: emailError?.message,
      code: emailError?.code,
      user: emailUser ? {
        id: emailUser.id,
        email: emailUser.email,
        name: `${emailUser.first_name} ${emailUser.last_name}`
      } : null
    });
    
    // Try with the exact email from auth user
    console.log('\n📊 Testing with auth user email...');
    const { data: authEmailUser, error: authEmailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', signInData.user.email)
      .single();
    
    console.log('Auth email query result:', {
      found: !!authEmailUser,
      error: authEmailError?.message,
      code: authEmailError?.code,
      user: authEmailUser ? {
        id: authEmailUser.id,
        email: authEmailUser.email,
        name: `${authEmailUser.first_name} ${authEmailUser.last_name}`
      } : null
    });
    
    // Check if there's a case sensitivity issue
    console.log('\n📊 Testing case variations...');
    const variations = [
      'rudvel@gmail.com',
      'RUDVEL@GMAIL.COM',
      'Rudvel@Gmail.com',
      'rudvel@Gmail.com'
    ];
    
    for (const email of variations) {
      const { data: user, error: error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      console.log(`${email}: ${user ? 'FOUND' : 'NOT FOUND'} ${error ? `(${error.code})` : ''}`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging email query:', error);
  }
}

debugEmailQuery();
