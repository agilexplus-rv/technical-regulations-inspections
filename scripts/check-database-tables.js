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

// Define all required tables for the application
const REQUIRED_TABLES = {
  // Core tables (from initial schema)
  'users': 'User accounts and authentication',
  'economic_operators': 'Business entities being inspected',
  'inspections': 'Main inspection records',
  'inspection_media': 'Photos and documents for inspections',
  'checklists': 'Inspection checklist templates',
  'inspection_runs': 'Individual checklist executions',
  'findings': 'Non-compliance findings',
  'notices': 'Official notices and warnings',
  'ai_results': 'AI agent analysis results',
  'integrations': 'External service integrations',
  'report_templates': 'Report generation templates',
  'mail_log': 'Email sending audit trail',
  'feedback_tokens': 'Feedback survey tokens',
  'feedback': 'Operator feedback responses',
  'feedback_sentiment': 'AI sentiment analysis of feedback',
  'holidays_mt': 'Malta public holidays',
  
  // Settings tables (from settings migrations)
  'product_categories': 'Product categories for inspections',
  'user_product_categories': 'Many-to-many relationship between users and product categories',
  'legislation': 'Legal references and regulations',
  'streets': 'Street names and geographic data',
};

const checkTable = async (tableName, description) => {
  try {
    console.log(`\n🔍 Checking table: ${tableName}`);
    console.log(`   Description: ${description}`);
    
    // Try to query the table structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`   ❌ Table does not exist`);
        return { exists: false, error: null };
      } else {
        console.log(`   ⚠️  Table exists but has query issues: ${error.message}`);
        return { exists: true, error: error.message };
      }
    } else {
      console.log(`   ✅ Table exists and is accessible`);
      
      // Try to get table structure by attempting to insert and then delete a test record
      // This will show us the column structure through the error message
      try {
        const testData = generateTestData(tableName);
        if (testData) {
          const { error: insertError } = await supabase
            .from(tableName)
            .insert(testData);
          
          if (insertError) {
            // Parse the error to understand the table structure
            if (insertError.message.includes('duplicate key')) {
              console.log(`   📊 Table has data and proper constraints`);
            } else if (insertError.message.includes('violates not-null constraint')) {
              console.log(`   📊 Table structure valid (missing required fields in test)`);
            } else {
              console.log(`   📊 Table accessible: ${insertError.message.substring(0, 100)}...`);
            }
          } else {
            console.log(`   📊 Test insert successful - table is writable`);
            // Clean up test data if insert was successful
            await supabase.from(tableName).delete().neq('id', 'test');
          }
        }
      } catch (structureError) {
        console.log(`   📊 Table structure check completed`);
      }
      
      return { exists: true, error: null };
    }
  } catch (error) {
    console.log(`   ❌ Error checking table: ${error.message}`);
    return { exists: false, error: error.message };
  }
};

const generateTestData = (tableName) => {
  const testDataMap = {
    'users': {
      email: 'test@example.com',
      role: 'inspector',
      first_name: 'Test',
      last_name: 'User',
      mfa_enabled: false
    },
    'product_categories': {
      name: 'Test Category',
      code: 'TEST001',
      description: 'Test category for verification',
      is_active: true
    },
    'legislation': {
      act_name: 'Test Act',
      article_number: 'Article 1',
      title: 'Test Article',
      content: 'Test content',
      is_active: true
    },
    'streets': {
      name: 'Test Street',
      locality: 'Test Locality',
      region: 'Test Region',
      is_manual: true,
      is_active: true
    }
  };
  
  return testDataMap[tableName] || null;
};

const checkDatabaseConnection = async () => {
  console.log('🚀 Checking database connection...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log(`❌ Database connection failed: ${error.message}`);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.log(`❌ Database connection error: ${error.message}`);
    return false;
  }
};

const main = async () => {
  console.log('🔍 Technical Regulations Inspections - Database Tables Check');
  console.log('=' .repeat(70));
  
  // Check database connection first
  const connectionOk = await checkDatabaseConnection();
  if (!connectionOk) {
    console.log('\n❌ Cannot proceed - database connection failed');
    process.exit(1);
  }
  
  console.log('\n📋 Checking all required tables...');
  console.log('=' .repeat(70));
  
  const results = {};
  let totalTables = 0;
  let existingTables = 0;
  let missingTables = 0;
  
  for (const [tableName, description] of Object.entries(REQUIRED_TABLES)) {
    totalTables++;
    const result = await checkTable(tableName, description);
    results[tableName] = result;
    
    if (result.exists) {
      existingTables++;
    } else {
      missingTables++;
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(70));
  console.log('📊 SUMMARY REPORT');
  console.log('=' .repeat(70));
  console.log(`Total tables checked: ${totalTables}`);
  console.log(`✅ Existing tables: ${existingTables}`);
  console.log(`❌ Missing tables: ${missingTables}`);
  
  if (missingTables > 0) {
    console.log('\n❌ MISSING TABLES:');
    Object.entries(results).forEach(([tableName, result]) => {
      if (!result.exists) {
        console.log(`   - ${tableName}: ${REQUIRED_TABLES[tableName]}`);
      }
    });
    
    console.log('\n🔧 TO FIX MISSING TABLES:');
    console.log('   1. Run database migrations: npm run db:migrate');
    console.log('   2. Or run the SQL files directly in your database');
    console.log('   3. Check supabase/migrations/ folder for migration files');
  } else {
    console.log('\n🎉 All required tables exist! Database is ready.');
  }
  
  // Check for any tables with issues
  const problematicTables = Object.entries(results).filter(([_, result]) => result.exists && result.error);
  if (problematicTables.length > 0) {
    console.log('\n⚠️  TABLES WITH ISSUES:');
    problematicTables.forEach(([tableName, result]) => {
      console.log(`   - ${tableName}: ${result.error}`);
    });
  }
  
  console.log('\n✨ Database check completed!');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
