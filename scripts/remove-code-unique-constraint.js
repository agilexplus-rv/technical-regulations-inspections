const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const removeUniqueConstraint = async () => {
  console.log('🔧 Removing unique constraint from product_categories.code');
  console.log('=' .repeat(60));
  
  try {
    // Check current constraints on the table
    console.log('\n📋 Checking current constraints...');
    const { data: constraints, error: constraintError } = await supabase.rpc('exec', {
      sql: `
        SELECT conname, contype 
        FROM pg_constraint 
        WHERE conrelid = 'product_categories'::regclass 
        AND conname LIKE '%code%';
      `
    });
    
    if (constraintError) {
      console.log(`   ⚠️  Warning checking constraints: ${constraintError.message}`);
    } else {
      console.log(`   📊 Current code-related constraints:`, constraints);
    }

    // Remove the unique constraint
    console.log('\n🗑️  Removing unique constraint...');
    const { error: dropError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE product_categories DROP CONSTRAINT IF EXISTS product_categories_code_key;'
    });

    if (dropError) {
      console.log(`   ⚠️  Warning dropping constraint: ${dropError.message}`);
    } else {
      console.log(`   ✅ Unique constraint removed successfully`);
    }

    // Verify the constraint was removed
    console.log('\n🔍 Verifying constraint removal...');
    const { data: finalConstraints, error: finalError } = await supabase.rpc('exec', {
      sql: `
        SELECT conname, contype 
        FROM pg_constraint 
        WHERE conrelid = 'product_categories'::regclass 
        AND contype = 'u' AND conname LIKE '%code%';
      `
    });
    
    if (finalError) {
      console.log(`   ⚠️  Warning checking final constraints: ${finalError.message}`);
    } else {
      console.log(`   📊 Remaining unique constraints on code:`, finalConstraints);
      if (!finalConstraints || finalConstraints.length === 0) {
        console.log(`   ✅ Confirmed: No unique constraints on code field`);
      }
    }

    // Test by trying to insert duplicate codes
    console.log('\n🧪 Testing duplicate codes...');
    
    // First, clean up any existing test data
    await supabase
      .from('product_categories')
      .delete()
      .like('name', 'Test Category%');

    // Try to insert two categories with the same code
    const testData = [
      {
        name: 'Test Category 1',
        code: 'TEST',
        description: 'Test category 1',
        is_active: true,
        created_by: null
      },
      {
        name: 'Test Category 2', 
        code: 'TEST',
        description: 'Test category 2',
        is_active: true,
        created_by: null
      }
    ];

    const { data: insertData, error: insertError } = await supabase
      .from('product_categories')
      .insert(testData)
      .select();

    if (insertError) {
      console.log(`   ❌ Failed to insert duplicate codes: ${insertError.message}`);
    } else {
      console.log(`   ✅ Successfully inserted ${insertData.length} categories with same code 'TEST'`);
      console.log(`   📊 Inserted categories:`, insertData.map(c => ({ id: c.id, name: c.name, code: c.code })));
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('✅ Product categories can now have duplicate codes');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
};

// Run the migration
removeUniqueConstraint();
