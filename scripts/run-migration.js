#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Running migration: 010_fix_report_templates_schema.sql');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '010_fix_report_templates_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('Migration failed:', error);
      return;
    }

    console.log('✅ Migration completed successfully');

    // Now let's verify the templates exist and have the right data
    const { data: templates, error: fetchError } = await supabase
      .from('report_templates')
      .select('*');

    if (fetchError) {
      console.error('Error fetching templates after migration:', fetchError);
      return;
    }

    console.log(`Found ${templates?.length || 0} templates after migration:`);
    templates?.forEach(template => {
      console.log(`- ${template.name}: ${template.description || 'No description'}`);
      console.log(`  Template content length: ${template.template_content?.length || 0} characters`);
      console.log(`  Active: ${template.is_active}, Default: ${template.is_default}`);
    });

  } catch (error) {
    console.error('Error running migration:', error);
  }
}

runMigration();
