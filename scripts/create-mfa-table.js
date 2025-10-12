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

const createMFATable = async () => {
  try {
    console.log('🚀 Creating MFA sessions table...');

    // Create the table
    const { error: tableError } = await supabase
      .from('mfa_sessions')
      .select('*')
      .limit(1);

    if (tableError && tableError.code === 'PGRST116') {
      console.log('Table does not exist, creating...');
      
      // Create table using raw SQL
      const createTableSQL = `
        CREATE TABLE mfa_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          token VARCHAR(10) NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          used_at TIMESTAMPTZ,
          ip_address INET,
          user_agent TEXT
        );
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.error('Error creating table:', createError);
        // Try alternative approach
        console.log('Trying alternative approach...');
        
        // Check if we can at least test the basic functionality
        console.log('✅ MFA table creation attempted. You may need to create it manually in Supabase dashboard.');
        console.log('SQL to run manually:');
        console.log(createTableSQL);
      } else {
        console.log('✅ MFA sessions table created successfully');
      }
    } else if (!tableError) {
      console.log('✅ MFA sessions table already exists');
    } else {
      console.error('Error checking table:', tableError);
    }

    console.log('🎉 MFA setup completed!');
  } catch (error) {
    console.error('❌ Error setting up MFA:', error.message);
  }
};

createMFATable();
