const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createOrganizationSettingsTable() {
  try {
    console.log('Creating organization_settings table...');

    // Check if update_updated_at_column function exists, if not create it
    const { error: functionError } = await supabase.rpc('create_update_function');
    if (functionError && !functionError.message.includes('already exists')) {
      console.log('Creating update_updated_at_column function...');
      const { error: createFunctionError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
          END;
          $$ language 'plpgsql';
        `
      });
      
      if (createFunctionError) {
        console.error('Error creating function:', createFunctionError);
      }
    }

    // Create the organization_settings table
    const createTableSQL = `
      -- Organization Settings table for storing general system configuration
      CREATE TABLE IF NOT EXISTS organization_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          -- Organization Information
          name VARCHAR(255) NOT NULL,
          short_name VARCHAR(100),
          description TEXT,
          website VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(50),
          address TEXT,
          inspection_prefix VARCHAR(10) DEFAULT 'INS',
          
          -- Regional Settings
          timezone VARCHAR(100) DEFAULT 'Europe/Malta',
          language VARCHAR(10) DEFAULT 'en',
          currency VARCHAR(10) DEFAULT 'EUR',
          date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
          time_format VARCHAR(10) DEFAULT '24h',
          
          -- System Preferences
          auto_generate_reports BOOLEAN DEFAULT true,
          email_notifications BOOLEAN DEFAULT true,
          sms_notifications BOOLEAN DEFAULT false,
          
          -- Data Management
          backup_frequency VARCHAR(20) DEFAULT 'daily',
          data_retention_days INTEGER DEFAULT 2555,
          
          -- Audit fields
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (tableError) {
      console.error('Error creating table:', tableError);
      return;
    }

    console.log('✅ Table created successfully');

    // Create trigger
    const triggerSQL = `
      CREATE TRIGGER update_organization_settings_updated_at
          BEFORE UPDATE ON organization_settings
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });
    
    if (triggerError && !triggerError.message.includes('already exists')) {
      console.error('Error creating trigger:', triggerError);
    } else {
      console.log('✅ Trigger created successfully');
    }

    // Insert default data
    const insertSQL = `
      INSERT INTO organization_settings (
          name,
          short_name,
          description,
          website,
          email,
          phone,
          address,
          inspection_prefix,
          timezone,
          language,
          currency,
          date_format,
          time_format,
          auto_generate_reports,
          email_notifications,
          sms_notifications,
          backup_frequency,
          data_retention_days
      ) VALUES (
          'Malta Competition and Consumer Affairs Authority',
          'MCCAA',
          'Regulatory authority responsible for consumer protection and market surveillance in Malta',
          'https://www.mccaa.org.mt',
          'info@mccaa.org.mt',
          '+356 2395 2000',
          'Malta Competition and Consumer Affairs Authority, Mizzi House, National Road, Blata l-Bajda HMR 9010, Malta',
          'INS',
          'Europe/Malta',
          'en',
          'EUR',
          'DD/MM/YYYY',
          '24h',
          true,
          true,
          false,
          'daily',
          2555
      ) ON CONFLICT DO NOTHING;
    `;

    const { error: insertError } = await supabase.rpc('exec_sql', { sql: insertSQL });
    
    if (insertError) {
      console.error('Error inserting default data:', insertError);
    } else {
      console.log('✅ Default data inserted successfully');
    }

    // Enable RLS
    const rlsSQL = `ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;`;
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    
    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
    } else {
      console.log('✅ RLS enabled successfully');
    }

    // Create RLS policies
    const policies = [
      `CREATE POLICY "Admins can view organization settings" ON organization_settings
          FOR SELECT USING (
              EXISTS (
                  SELECT 1 FROM users 
                  WHERE users.id = auth.uid() 
                  AND users.role = 'admin'
              )
          );`,
      `CREATE POLICY "Admins can update organization settings" ON organization_settings
          FOR UPDATE USING (
              EXISTS (
                  SELECT 1 FROM users 
                  WHERE users.id = auth.uid() 
                  AND users.role = 'admin'
              )
          );`,
      `CREATE POLICY "Admins can insert organization settings" ON organization_settings
          FOR INSERT WITH CHECK (
              EXISTS (
                  SELECT 1 FROM users 
                  WHERE users.id = auth.uid() 
                  AND users.role = 'admin'
              )
          );`
    ];

    for (const policySQL of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySQL });
      
      if (policyError && !policyError.message.includes('already exists')) {
        console.error('Error creating policy:', policyError);
      }
    }

    console.log('✅ RLS policies created successfully');
    console.log('🎉 Organization settings table setup completed!');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Check if exec_sql function exists, if not create it
async function setupExecSqlFunction() {
  const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1;' });
  
  if (error && error.message.includes('function exec_sql')) {
    console.log('Creating exec_sql function...');
    
    const createExecSqlFunction = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `;

    // Try to create the function using a direct query
    const { error: createError } = await supabase
      .from('pg_proc')
      .select('*')
      .limit(1);
    
    if (createError) {
      console.log('Note: exec_sql function creation requires database admin access.');
      console.log('Please run the SQL migration manually in your Supabase SQL editor.');
      console.log('SQL to run:');
      console.log(createExecSqlFunction);
      return false;
    }
  }
  
  return true;
}

async function main() {
  const canExecSql = await setupExecSqlFunction();
  
  if (!canExecSql) {
    console.log('\n📋 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the contents of: supabase/migrations/005_organization_settings.sql');
    return;
  }

  await createOrganizationSettingsTable();
}

main();
