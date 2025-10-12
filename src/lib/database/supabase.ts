import { createClient } from '@supabase/supabase-js';

// Configuration with fallback values
const getSupabaseConfig = () => {
  // Try to get from environment variables first (for production)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muzpbudurlatuznkrgtx.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11enBidWR1cmxhdHV6bmtyZ3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMDkwMjYsImV4cCI6MjA3NTY4NTAyNn0.cANxqD24a2iVbxsSZmnZV5Yxx9z8fdbHRQvQO9KQx5Y';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11enBidWR1cmxhdHV6bmtyZ3R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDEwOTAyNiwiZXhwIjoyMDc1Njg1MDI2fQ.MmErF4J-SBrK4ActQ3zkDNPQbpSLiD4J_R6rtj_h4Jg';

  return { url, anonKey, serviceRoleKey };
};

// Factory functions for creating Supabase clients
export const createSupabaseClient = () => {
  const { url, anonKey } = getSupabaseConfig();
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });
};

export const createSupabaseAdminClient = () => {
  const { url, serviceRoleKey } = getSupabaseConfig();
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Export the clients (lazy initialization)
let _supabase: ReturnType<typeof createClient> | null = null;
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

export const supabase = {
  get auth() {
    if (!_supabase) _supabase = createSupabaseClient();
    return _supabase.auth;
  },
  get from() {
    if (!_supabase) _supabase = createSupabaseClient();
    return _supabase.from;
  },
  get storage() {
    if (!_supabase) _supabase = createSupabaseClient();
    return _supabase.storage;
  },
  get channel() {
    if (!_supabase) _supabase = createSupabaseClient();
    return _supabase.channel;
  },
  get removeChannel() {
    if (!_supabase) _supabase = createSupabaseClient();
    return _supabase.removeChannel;
  },
  get getChannels() {
    if (!_supabase) _supabase = createSupabaseClient();
    return _supabase.getChannels;
  }
} as ReturnType<typeof createClient>;

export const supabaseAdmin = {
  get auth() {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return _supabaseAdmin.auth;
  },
  get from() {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return _supabaseAdmin.from;
  },
  get storage() {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return _supabaseAdmin.storage;
  },
  get channel() {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return _supabaseAdmin.channel;
  },
  get removeChannel() {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return _supabaseAdmin.removeChannel;
  },
  get getChannels() {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return _supabaseAdmin.getChannels;
  }
} as ReturnType<typeof createClient>;

// Server component client (simple version for now)
export const createSupabaseServerClient = createSupabaseClient;

// Database types (generated from Supabase)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: string;
          first_name: string | null;
          last_name: string | null;
          mfa_enabled: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: string;
          first_name?: string | null;
          last_name?: string | null;
          mfa_enabled?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          first_name?: string | null;
          last_name?: string | null;
          mfa_enabled?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      economic_operators: {
        Row: {
          id: string;
          name: string;
          vat_number: string | null;
          email: string | null;
          address: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          vat_number?: string | null;
          email?: string | null;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          vat_number?: string | null;
          email?: string | null;
          address?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inspections: {
        Row: {
          id: string;
          status: string;
          created_by: string;
          assigned_to: string;
          economic_operator_id: string | null;
          vat_number: string | null;
          vat_status: string;
          location_lat: number | null;
          location_lng: number | null;
          address_suggested: string | null;
          address_final: string | null;
          address_accuracy_m: number | null;
          started_at: string | null;
          completed_at: string | null;
          investigation_id: string | null;
          ai_summary_json: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          status?: string;
          created_by: string;
          assigned_to: string;
          economic_operator_id?: string | null;
          vat_number?: string | null;
          vat_status?: string;
          location_lat?: number | null;
          location_lng?: number | null;
          address_suggested?: string | null;
          address_final?: string | null;
          address_accuracy_m?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          investigation_id?: string | null;
          ai_summary_json?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          status?: string;
          created_by?: string;
          assigned_to?: string;
          economic_operator_id?: string | null;
          vat_number?: string | null;
          vat_status?: string;
          location_lat?: number | null;
          location_lng?: number | null;
          address_suggested?: string | null;
          address_final?: string | null;
          address_accuracy_m?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          investigation_id?: string | null;
          ai_summary_json?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other tables as needed...
    };
  };
};
