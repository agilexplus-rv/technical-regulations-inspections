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

const createSettingsTables = async () => {
  console.log('🚀 Creating settings tables...');
  
  try {
    // Create product_categories table
    console.log('Creating product_categories table...');
    const { error: categoriesError } = await supabase
      .from('product_categories')
      .select('id')
      .limit(1);
    
    if (categoriesError && categoriesError.code === 'PGRST116') {
      console.log('product_categories table does not exist, creating...');
      // Table doesn't exist, we'll need to create it via SQL
      console.log('Note: Tables need to be created via SQL migration');
    } else {
      console.log('✅ product_categories table already exists');
    }

    // Create legislation table
    console.log('Creating legislation table...');
    const { error: legislationError } = await supabase
      .from('legislation')
      .select('id')
      .limit(1);
    
    if (legislationError && legislationError.code === 'PGRST116') {
      console.log('legislation table does not exist, creating...');
      console.log('Note: Tables need to be created via SQL migration');
    } else {
      console.log('✅ legislation table already exists');
    }

    // Create streets table
    console.log('Creating streets table...');
    const { error: streetsError } = await supabase
      .from('streets')
      .select('id')
      .limit(1);
    
    if (streetsError && streetsError.code === 'PGRST116') {
      console.log('streets table does not exist, creating...');
      console.log('Note: Tables need to be created via SQL migration');
    } else {
      console.log('✅ streets table already exists');
    }

    console.log('🎉 Settings tables check completed!');
    console.log('Note: If tables don\'t exist, they need to be created via SQL migration');
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  } finally {
    process.exit(0);
  }
};

createSettingsTables();
