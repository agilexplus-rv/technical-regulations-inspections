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

const runMigration = async () => {
  try {
    console.log('Running ban status migration...');
    
    // Add ban_status column
    console.log('Adding ban_status column...');
    const { error: columnError } = await supabase.rpc('exec', { 
      sql: 'ALTER TABLE users ADD COLUMN ban_status BOOLEAN DEFAULT FALSE;' 
    });
    
    if (columnError) {
      console.error('Error adding column:', columnError.message);
      // Check if column already exists
      if (columnError.message.includes('already exists')) {
        console.log('Column already exists, continuing...');
      } else {
        throw columnError;
      }
    } else {
      console.log('✅ Added ban_status column');
    }

    // Create index
    console.log('Creating index...');
    const { error: indexError } = await supabase.rpc('exec', { 
      sql: 'CREATE INDEX IF NOT EXISTS idx_users_ban_status ON users(ban_status);' 
    });
    
    if (indexError) {
      console.error('Error creating index:', indexError.message);
      // Don't throw here as index might already exist
    } else {
      console.log('✅ Created index');
    }

    // Create function
    console.log('Creating is_user_banned function...');
    const functionSQL = `
      CREATE OR REPLACE FUNCTION is_user_banned(user_id UUID)
      RETURNS BOOLEAN AS $$
      BEGIN
          RETURN (SELECT ban_status FROM users WHERE id = user_id);
      EXCEPTION
          WHEN NO_DATA_FOUND THEN
              RETURN FALSE;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    const { error: functionError } = await supabase.rpc('exec', { sql: functionSQL });
    
    if (functionError) {
      console.error('Error creating function:', functionError.message);
      throw functionError;
    } else {
      console.log('✅ Created is_user_banned function');
    }
    
    console.log('✅ Ban status migration completed');
  } catch (error) {
    console.error(`❌ Error running ban status migration:`, error.message);
    throw error;
  }
};

runMigration().then(() => {
  console.log('🎉 Migration completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
