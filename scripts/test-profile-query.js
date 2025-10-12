#!/usr/bin/env node

/**
 * Script to test if the user profile query works
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://muzpbudurlatuznkrgtx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11enBidWR1cmxhdHV6bmtyZ3R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwOTAyNiwiZXhwIjoyMDc1Njg1MDI2fQ.MmErF4J-SBrK4ActQ3zkDNPQbpSLiD4J_R6rtj_h4Jg';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11enBidWR1cmxhdHV6bmtyZ3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDkwMjYsImV4cCI6MjA3NTY4NTAyNn0.cANxqD24a2iVbxsSZmnZV5Yxx9z8fdbHRQvQO9KQx5Y';

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testProfileQuery() {
  const userId = '396d2861-f674-4284-8ed6-e7e2fdd4128a';
  
  try {
    console.log('Testing profile query with service role...');
    
    // Test with service role (should work)
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Service role query result:', { data: serviceData, error: serviceError });

    console.log('\nTesting profile query with anon key...');
    
    // Test with anon key (might fail due to RLS)
    const { data: anonData, error: anonError } = await anonClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Anon key query result:', { data: anonData, error: anonError });

    console.log('\nTesting with auth context...');
    
    // Test with auth context (should work if user is authenticated)
    const { data: authData, error: authError } = await anonClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('Auth context query result:', { data: authData, error: authError });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
testProfileQuery();
