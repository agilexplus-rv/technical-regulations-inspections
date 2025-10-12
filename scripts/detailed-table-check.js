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

const checkTableStructure = async (tableName) => {
  console.log(`\n🔍 Detailed check for table: ${tableName}`);
  console.log('-'.repeat(50));
  
  try {
    // Method 1: Try to select from the table
    console.log('1️⃣ Testing basic SELECT query...');
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ SELECT failed: ${error.message}`);
      console.log(`   Error code: ${error.code}`);
      console.log(`   Error details: ${error.details}`);
      console.log(`   Error hint: ${error.hint}`);
    } else {
      console.log(`   ✅ SELECT successful`);
      if (data && data.length > 0) {
        console.log(`   📊 Found ${data.length} record(s)`);
        console.log(`   📋 Sample record keys: ${Object.keys(data[0]).join(', ')}`);
      } else {
        console.log(`   📊 Table is empty`);
      }
    }
    
    // Method 2: Try to get table info using RPC (if available)
    console.log('\n2️⃣ Testing table metadata...');
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: tableName });
      
      if (tableError) {
        console.log(`   ⚠️  RPC method not available: ${tableError.message}`);
      } else {
        console.log(`   ✅ Table metadata: ${JSON.stringify(tableInfo)}`);
      }
    } catch (rpcError) {
      console.log(`   ⚠️  RPC method not available`);
    }
    
    // Method 3: Try to insert a test record (for tables we know the structure)
    console.log('\n3️⃣ Testing INSERT capability...');
    const testData = getTestData(tableName);
    if (testData) {
      try {
        const { data: insertData, error: insertError } = await supabase
          .from(tableName)
          .insert(testData)
          .select();
        
        if (insertError) {
          console.log(`   ⚠️  INSERT failed: ${insertError.message}`);
          if (insertError.message.includes('duplicate key')) {
            console.log(`   ℹ️  This suggests the table exists but has unique constraints`);
          }
        } else {
          console.log(`   ✅ INSERT successful`);
          console.log(`   📊 Inserted record ID: ${insertData[0]?.id || 'N/A'}`);
          
          // Clean up test data
          if (insertData[0]?.id) {
            await supabase.from(tableName).delete().eq('id', insertData[0].id);
            console.log(`   🧹 Cleaned up test record`);
          }
        }
      } catch (insertError) {
        console.log(`   ❌ INSERT error: ${insertError.message}`);
      }
    } else {
      console.log(`   ⏭️  Skipping INSERT test (no test data defined)`);
    }
    
  } catch (error) {
    console.log(`   ❌ Unexpected error: ${error.message}`);
  }
};

const getTestData = (tableName) => {
  const testDataMap = {
    'product_categories': {
      name: 'Test Category ' + Date.now(),
      code: 'TEST' + Date.now(),
      description: 'Test category for verification',
      is_active: true
    },
    'legislation': {
      act_name: 'Test Act ' + Date.now(),
      article_number: 'Article 1',
      title: 'Test Article',
      content: 'Test content',
      is_active: true
    },
    'streets': {
      name: 'Test Street ' + Date.now(),
      locality: 'Test Locality',
      region: 'Test Region',
      is_manual: true,
      is_active: true
    }
  };
  
  return testDataMap[tableName] || null;
};

const checkSchemaCache = async () => {
  console.log('🔍 Checking Supabase schema cache...');
  
  try {
    // Try to query information_schema to see what tables exist
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .in('table_name', ['product_categories', 'user_product_categories', 'legislation', 'streets']);
    
    if (error) {
      console.log(`   ❌ Schema query failed: ${error.message}`);
    } else {
      console.log(`   ✅ Found ${data.length} settings tables in schema:`);
      data.forEach(table => {
        console.log(`      - ${table.table_schema}.${table.table_name}`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Schema check error: ${error.message}`);
  }
};

const main = async () => {
  console.log('🔍 Detailed Database Table Structure Check');
  console.log('=' .repeat(60));
  
  // Check schema cache first
  await checkSchemaCache();
  
  // Check the problematic tables in detail
  const problematicTables = ['product_categories', 'user_product_categories', 'legislation', 'streets'];
  
  for (const tableName of problematicTables) {
    await checkTableStructure(tableName);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 RECOMMENDATIONS:');
  console.log('=' .repeat(60));
  console.log('1. If tables show "schema cache" errors, try:');
  console.log('   - Restart your Supabase project');
  console.log('   - Check if migrations were applied correctly');
  console.log('   - Verify table permissions and RLS policies');
  console.log('\n2. If INSERT tests fail, check:');
  console.log('   - Required fields and constraints');
  console.log('   - Foreign key relationships');
  console.log('   - Unique constraints');
  console.log('\n3. To manually verify tables exist:');
  console.log('   - Use Supabase Dashboard SQL Editor');
  console.log('   - Run: SELECT * FROM information_schema.tables WHERE table_schema = \'public\';');
  
  console.log('\n✨ Detailed check completed!');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
