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

const dropTableIfExists = async (tableName) => {
  console.log(`🗑️  Dropping table ${tableName} if it exists...`);
  try {
    const { error } = await supabase.rpc('exec', { 
      sql: `DROP TABLE IF EXISTS ${tableName} CASCADE;` 
    });
    
    if (error) {
      console.log(`   ⚠️  Error dropping table: ${error.message}`);
    } else {
      console.log(`   ✅ Table ${tableName} dropped successfully`);
    }
  } catch (error) {
    console.log(`   ⚠️  Drop error: ${error.message}`);
  }
};

const createTable = async (tableName, createSQL) => {
  console.log(`\n🔧 Creating table ${tableName}...`);
  try {
    const { error } = await supabase.rpc('exec', { sql: createSQL });
    
    if (error) {
      console.log(`   ❌ Error creating table: ${error.message}`);
      return false;
    } else {
      console.log(`   ✅ Table ${tableName} created successfully`);
      return true;
    }
  } catch (error) {
    console.log(`   ❌ Creation error: ${error.message}`);
    return false;
  }
};

const createIndex = async (indexName, indexSQL) => {
  console.log(`📊 Creating index ${indexName}...`);
  try {
    const { error } = await supabase.rpc('exec', { sql: indexSQL });
    
    if (error) {
      console.log(`   ⚠️  Index creation warning: ${error.message}`);
    } else {
      console.log(`   ✅ Index ${indexName} created successfully`);
    }
  } catch (error) {
    console.log(`   ⚠️  Index error: ${error.message}`);
  }
};

const createTrigger = async (triggerName, triggerSQL) => {
  console.log(`⚡ Creating trigger ${triggerName}...`);
  try {
    const { error } = await supabase.rpc('exec', { sql: triggerSQL });
    
    if (error) {
      console.log(`   ⚠️  Trigger creation warning: ${error.message}`);
    } else {
      console.log(`   ✅ Trigger ${triggerName} created successfully`);
    }
  } catch (error) {
    console.log(`   ⚠️  Trigger error: ${error.message}`);
  }
};

const main = async () => {
  console.log('🔧 Fixing Settings Tables - Clean Installation');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Drop existing tables if they exist
    console.log('\n📋 Step 1: Cleaning up existing tables...');
    await dropTableIfExists('user_product_categories');
    await dropTableIfExists('product_categories');
    await dropTableIfExists('legislation');
    await dropTableIfExists('streets');
    await dropTableIfExists('geo_streets'); // In case it exists from previous migration
    
    // Step 2: Create function if it doesn't exist
    console.log('\n📋 Step 2: Creating update function...');
    const updateFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    
    const { error: functionError } = await supabase.rpc('exec', { sql: updateFunctionSQL });
    if (functionError) {
      console.log(`   ⚠️  Function creation warning: ${functionError.message}`);
    } else {
      console.log(`   ✅ Update function created successfully`);
    }
    
    // Step 3: Create tables one by one
    console.log('\n📋 Step 3: Creating tables...');
    
    // Product Categories table
    const productCategoriesSQL = `
      CREATE TABLE product_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          code VARCHAR(50) UNIQUE,
          is_active BOOLEAN DEFAULT true,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const productCategoriesSuccess = await createTable('product_categories', productCategoriesSQL);
    
    // User Product Categories table
    const userProductCategoriesSQL = `
      CREATE TABLE user_product_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
          assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
          assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, product_category_id)
      );
    `;
    
    const userProductCategoriesSuccess = await createTable('user_product_categories', userProductCategoriesSQL);
    
    // Legislation table
    const legislationSQL = `
      CREATE TABLE legislation (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(500) NOT NULL,
          description TEXT,
          act_name VARCHAR(255) NOT NULL,
          article_number VARCHAR(50),
          section_number VARCHAR(50),
          content TEXT,
          effective_date DATE,
          is_active BOOLEAN DEFAULT true,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const legislationSuccess = await createTable('legislation', legislationSQL);
    
    // Streets table
    const streetsSQL = `
      CREATE TABLE streets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          locality VARCHAR(255) NOT NULL,
          region VARCHAR(255) NOT NULL,
          postcode VARCHAR(10),
          is_manual BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(name, locality, region)
      );
    `;
    
    const streetsSuccess = await createTable('streets', streetsSQL);
    
    // Step 4: Create indexes
    console.log('\n📋 Step 4: Creating indexes...');
    
    if (productCategoriesSuccess) {
      await createIndex('idx_product_categories_active', 
        'CREATE INDEX idx_product_categories_active ON product_categories(is_active);');
      await createIndex('idx_product_categories_code', 
        'CREATE INDEX idx_product_categories_code ON product_categories(code);');
    }
    
    if (userProductCategoriesSuccess) {
      await createIndex('idx_user_product_categories_user_id', 
        'CREATE INDEX idx_user_product_categories_user_id ON user_product_categories(user_id);');
      await createIndex('idx_user_product_categories_category_id', 
        'CREATE INDEX idx_user_product_categories_category_id ON user_product_categories(product_category_id);');
    }
    
    if (legislationSuccess) {
      await createIndex('idx_legislation_active', 
        'CREATE INDEX idx_legislation_active ON legislation(is_active);');
      await createIndex('idx_legislation_act_name', 
        'CREATE INDEX idx_legislation_act_name ON legislation(act_name);');
    }
    
    if (streetsSuccess) {
      await createIndex('idx_streets_active', 
        'CREATE INDEX idx_streets_active ON streets(is_active);');
      await createIndex('idx_streets_locality', 
        'CREATE INDEX idx_streets_locality ON streets(locality);');
      await createIndex('idx_streets_region', 
        'CREATE INDEX idx_streets_region ON streets(region);');
      await createIndex('idx_streets_manual', 
        'CREATE INDEX idx_streets_manual ON streets(is_manual);');
    }
    
    // Step 5: Create triggers
    console.log('\n📋 Step 5: Creating triggers...');
    
    if (productCategoriesSuccess) {
      await createTrigger('update_product_categories_updated_at', 
        'CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
    }
    
    if (legislationSuccess) {
      await createTrigger('update_legislation_updated_at', 
        'CREATE TRIGGER update_legislation_updated_at BEFORE UPDATE ON legislation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
    }
    
    if (streetsSuccess) {
      await createTrigger('update_streets_updated_at', 
        'CREATE TRIGGER update_streets_updated_at BEFORE UPDATE ON streets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();');
    }
    
    // Step 6: Verify tables were created
    console.log('\n📋 Step 6: Verifying table creation...');
    const tablesToVerify = ['product_categories', 'user_product_categories', 'legislation', 'streets'];
    
    for (const tableName of tablesToVerify) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`   ✅ ${tableName}: Table accessible`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: ${err.message}`);
      }
    }
    
    console.log('\n🎉 Settings tables creation completed!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Run: node scripts/check-database-tables.js');
    console.log('2. Test your settings system in the app');
    console.log('3. If you need RLS policies, run the RLS migration separately');
    
  } catch (error) {
    console.log(`❌ Script error: ${error.message}`);
  } finally {
    process.exit(0);
  }
};

main().catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
