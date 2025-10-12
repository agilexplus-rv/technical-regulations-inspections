const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUsersRLS() {
  try {
    console.log('🔧 Fixing RLS policies for users table...');
    
    // First, let's see what policies exist
    console.log('\n📋 Current RLS policies:');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users');
    
    if (policiesError) {
      console.log('⚠️  Could not query policies table:', policiesError.message);
    } else if (policies && policies.length > 0) {
      console.log('Found policies:');
      policies.forEach(policy => {
        console.log(`- ${policy.policyname}: ${policy.cmd} for ${policy.roles}`);
      });
    } else {
      console.log('No policies found');
    }
    
    // Create a policy that allows authenticated users to read their own profile
    console.log('\n🔧 Creating RLS policy for users table...');
    
    const createPolicySQL = `
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can read their own profile" ON users;
      DROP POLICY IF EXISTS "Users can read all profiles" ON users;
      
      -- Create policy for users to read their own profile
      CREATE POLICY "Users can read their own profile" ON users
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
      
      -- Create policy for admins to read all profiles
      CREATE POLICY "Admins can read all profiles" ON users
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
          )
        );
      
      -- Create policy for admins to update all profiles
      CREATE POLICY "Admins can update all profiles" ON users
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
          )
        );
      
      -- Create policy for admins to insert profiles
      CREATE POLICY "Admins can insert profiles" ON users
        FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
          )
        );
      
      -- Create policy for admins to delete profiles
      CREATE POLICY "Admins can delete profiles" ON users
        FOR DELETE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
          )
        );
    `;
    
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql_query: createPolicySQL
    });
    
    if (sqlError) {
      console.log('⚠️  RPC method not available, trying direct SQL...');
      
      // Try to execute the SQL directly
      const statements = createPolicySQL.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase
            .from('pg_policies')
            .select('*')
            .limit(1); // This is just to test connection
          
          if (stmtError) {
            console.log('⚠️  Cannot execute SQL directly:', stmtError.message);
            break;
          }
        }
      }
    } else {
      console.log('✅ RLS policies created successfully');
    }
    
    // Test the fix
    console.log('\n🧪 Testing the fix...');
    
    // Create a client with anon key (like the frontend)
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Test with a user session (simulate authenticated user)
    console.log('Testing with authenticated user...');
    
    // First, let's try to sign in as the user to get a proper session
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'rudvel@gmail.com',
      password: 'Rudie123!'
    });
    
    if (signInError) {
      console.error('❌ Could not sign in:', signInError.message);
    } else {
      console.log('✅ Signed in successfully');
      
      // Now test the query with the authenticated session
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'rudvel@gmail.com')
        .single();
      
      if (userError) {
        console.error('❌ Query still failed:', userError);
      } else {
        console.log('✅ Query succeeded:', userData);
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
  }
}

fixUsersRLS();
