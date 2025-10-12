const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncAdminUser() {
  try {
    console.log('🔍 Checking existing user with email: rudvel@gmail.com');
    
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
      
      // Check if user exists in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(dbUser.id);
      
      if (authError) {
        console.log('\n❌ User not found in Supabase Auth, creating...');
        
        // Create user in Supabase Auth
        const { data: authData, error: createError } = await supabase.auth.admin.createUser({
          email: dbUser.email,
          password: 'Rudie123!',
          email_confirm: true,
          user_metadata: {
            first_name: 'Rudie',
            last_name: 'Vella',
          }
        });
        
        if (createError) {
          console.error('❌ Failed to create user in Supabase Auth:', createError.message);
          return;
        }
        
        console.log('✅ User created in Supabase Auth');
        
        // Update database with new Auth ID and correct name
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            id: authData.user.id,
            first_name: 'Rudie',
            last_name: 'Vella',
            updated_at: new Date().toISOString()
          })
          .eq('email', 'rudvel@gmail.com');
        
        if (updateError) {
          console.error('❌ Failed to update database:', updateError.message);
          return;
        }
        
        console.log('✅ Database updated with new Auth ID and correct name');
        
      } else {
        console.log('\n✅ User already exists in Supabase Auth');
        
        // Update password in Supabase Auth
        const { error: passwordError } = await supabase.auth.admin.updateUserById(dbUser.id, {
          password: 'Rudie123!'
        });
        
        if (passwordError) {
          console.error('❌ Failed to update password:', passwordError.message);
        } else {
          console.log('✅ Password updated in Supabase Auth');
        }
        
        // Update name in database if different
        if (dbUser.first_name !== 'Rudie' || dbUser.last_name !== 'Vella') {
          const { error: nameError } = await supabase
            .from('users')
            .update({ 
              first_name: 'Rudie',
              last_name: 'Vella',
              updated_at: new Date().toISOString()
            })
            .eq('id', dbUser.id);
          
          if (nameError) {
            console.error('❌ Failed to update name:', nameError.message);
          } else {
            console.log('✅ Name updated in database');
          }
        }
      }
      
    } else {
      console.log('❌ User not found in database, creating new user...');
      
      // Create user in Supabase Auth first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'rudvel@gmail.com',
        password: 'Rudie123!',
        email_confirm: true,
        user_metadata: {
          first_name: 'Rudie',
          last_name: 'Vella',
        }
      });
      
      if (authError) {
        console.error('❌ Failed to create user in Supabase Auth:', authError.message);
        return;
      }
      
      // Create user in database
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: 'rudvel@gmail.com',
          role: 'admin',
          first_name: 'Rudie',
          last_name: 'Vella',
          mfa_enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (dbError) {
        console.error('❌ Failed to create user in database:', dbError.message);
        return;
      }
      
      console.log('✅ New user created in both systems');
    }
    
    console.log('\n🎉 Admin user setup completed successfully!');
    console.log('\n📋 Final User Details:');
    console.log('- Name: Rudie Vella');
    console.log('- Email: rudvel@gmail.com');
    console.log('- Password: Rudie123!');
    console.log('- Role: Admin');
    
    console.log('\n🔐 Login Instructions:');
    console.log('1. Go to the login page');
    console.log('2. Enter email: rudvel@gmail.com');
    console.log('3. Enter password: Rudie123!');
    console.log('4. You will have full admin access to the system');
    
  } catch (error) {
    console.error('❌ Error syncing admin user:', error);
  }
}

syncAdminUser();
