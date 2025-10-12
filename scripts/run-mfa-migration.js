const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

const runMigration = async (migrationFile) => {
  try {
    console.log(`Running migration: ${migrationFile}`);
    const sql = fs.readFileSync(path.join(__dirname, '..', migrationFile), 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement.trim() });
        if (error) {
          console.error(`Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement.substring(0, 100)}...`);
        } else {
          console.log(`✅ Executed statement successfully`);
        }
      }
    }
    
    console.log(`✅ Migration ${migrationFile} completed`);
  } catch (error) {
    console.error(`❌ Error running migration ${migrationFile}:`, error.message);
  }
};

const runMFAMigration = async () => {
  console.log('🚀 Starting MFA migration...');
  
  await runMigration('supabase/migrations/007_mfa_sessions.sql');
  
  console.log('🎉 MFA migration completed!');
  process.exit(0);
};

runMFAMigration();
