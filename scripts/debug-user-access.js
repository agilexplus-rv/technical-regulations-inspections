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

const debugUserAccess = async () => {
  try {
    console.log('🔍 Debugging user access for rudie@agilexplus.com...');

    // Find the user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'rudie@agilexplus.com')
      .single();

    if (userError) {
      console.error('❌ Error finding user:', userError.message);
      return;
    }

    console.log('✅ User found:', {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      mfa_enabled: userData.mfa_enabled,
      created_at: userData.created_at
    });

    // Test the getAllUsers function logic
    console.log('\n🧪 Testing getAllUsers access logic...');
    const userId = userData.id;
    const userRole = userData.role;

    console.log('User ID:', userId);
    console.log('User Role:', userRole);
    console.log('Role check (userRole !== "admin"):', userRole !== "admin");

    if (!userId || userRole !== "admin") {
      console.log('❌ Access denied - Admin access required');
      console.log('Reasons:');
      console.log('- userId exists:', !!userId);
      console.log('- userRole is admin:', userRole === "admin");
    } else {
      console.log('✅ Access granted - User has admin role');
    }

    // Test if we can actually fetch users
    console.log('\n🧪 Testing actual user fetch...');
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select(`
        *,
        user_product_categories!user_product_categories_user_id_fkey (
          product_category_id,
          product_categories!user_product_categories_product_category_id_fkey (
            id,
            name,
            code
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError.message);
    } else {
      console.log('✅ Successfully fetched', allUsers.length, 'users');
      console.log('Users:', allUsers.map(u => ({ email: u.email, role: u.role })));
    }

  } catch (error) {
    console.error('❌ Error in debug:', error.message);
  }
};

debugUserAccess();
