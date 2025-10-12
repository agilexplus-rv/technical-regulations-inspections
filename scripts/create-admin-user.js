const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user...');
    
    const userData = {
      email: 'rudvel@gmail.com',
      password: 'Rudie123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Rudie',
        last_name: 'Vella',
      }
    };
    
    console.log('📧 Email:', userData.email);
    console.log('👤 Name:', `${userData.user_metadata.first_name} ${userData.user_metadata.last_name}`);
    console.log('🔑 Password:', userData.password);
    console.log('👑 Role: Admin');
    
    // Create user in Supabase Auth
    console.log('\n📝 Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser(userData);
    
    if (authError) {
      console.error('❌ Failed to create user in Supabase Auth:', authError.message);
      return;
    }
    
    console.log('✅ User created in Supabase Auth:', {
      id: authData.user.id,
      email: authData.user.email,
      created_at: authData.user.created_at
    });
    
    // Create user profile in database
    console.log('\n📝 Creating user profile in database...');
    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        role: 'admin',
        first_name: userData.user_metadata.first_name,
        last_name: userData.user_metadata.last_name,
        mfa_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (dbError) {
      console.error('❌ Failed to create user profile in database:', dbError.message);
      
      // Clean up: delete from Supabase Auth if database creation failed
      console.log('🧹 Cleaning up Supabase Auth user due to database error...');
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }
    
    console.log('✅ User profile created in database');
    
    console.log('\n🎉 Admin user created successfully!');
    console.log('\n📋 User Details:');
    console.log('- ID:', authData.user.id);
    console.log('- Name: Rudie Vella');
    console.log('- Email: rudvel@gmail.com');
    console.log('- Role: Admin');
    console.log('- Password: Rudie123!');
    console.log('- MFA Enabled: No');
    
    console.log('\n🔐 Login Instructions:');
    console.log('1. Go to the login page');
    console.log('2. Enter email: rudvel@gmail.com');
    console.log('3. Enter password: Rudie123!');
    console.log('4. You will have full admin access to the system');
    
    console.log('\n⚠️  Security Note:');
    console.log('- The user should change their password after first login');
    console.log('- Consider enabling MFA for enhanced security');
    console.log('- This user has full administrative privileges');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

createAdminUser();
