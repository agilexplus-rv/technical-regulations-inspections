import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Configuration with fallback values
const getSupabaseConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muzpbudurlatuznkrgtx.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11enBidWR1cmxhdHV6bmtyZ3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDkwMjYsImV4cCI6MjA3NTY4NTAyNn0.cANxqD24a2iVbxsSZmnZV5Yxx9z8fdbHRQvQO9KQx5Y';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11enBidWR1cmxhdHV6bmtyZ3R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwOTAyNiwiZXhwIjoyMDc1Njg1MDI2fQ.MmErF4J-SBrK4ActQ3zkDNPQbpSLiD4J_R6rtj_h4Jg';

  return { url, anonKey, serviceRoleKey };
};

// Server component client that can read session from cookies
export const createSupabaseServerClient = () => {
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = cookies();
  
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
      storage: {
        getItem: (key: string) => {
          console.log('Server: Getting item from storage:', key);
          const cookie = cookieStore.get(key);
          console.log('Server: Cookie found:', cookie ? 'Yes' : 'No');
          return cookie?.value || null;
        },
        setItem: (key: string, value: string) => {
          console.log('Server: Setting item in storage (no-op):', key);
          // No-op for server-side
        },
        removeItem: (key: string) => {
          console.log('Server: Removing item from storage (no-op):', key);
          // No-op for server-side
        },
      },
    },
  });
};

// Admin client for server-side operations
export const createSupabaseAdminClient = () => {
  const { url, serviceRoleKey } = getSupabaseConfig();
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};