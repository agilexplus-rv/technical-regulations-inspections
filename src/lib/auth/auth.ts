import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/auth/server-auth';
import { User, UserRole } from '@/types';
import { createRBAC } from './rbac';

export interface AuthUser extends User {
  rbac: ReturnType<typeof createRBAC>;
}

/**
 * Get the current authenticated user from server-side
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createSupabaseServerClient();
  
  try {
    // First try to get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Server: Session check result:', session ? 'Session found' : 'No session', sessionError);
    
    if (sessionError) {
      console.log('Server: Session error:', sessionError);
    }
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('No authenticated user found, error:', error);
      return null;
    }

    console.log('Found authenticated user:', user.id);

    // Use admin client to bypass RLS when fetching user profile
    const adminSupabase = createSupabaseAdminClient();
    const { data: profile, error: profileError } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('No user profile found in database, creating default profile for:', user.id);
      
      // Create a default user profile if none exists
      const defaultProfile: AuthUser = {
        id: user.id,
        email: user.email || 'unknown@example.com',
        role: 'admin' as UserRole, // Default to admin for now
        firstName: 'Test',
        lastName: 'Admin',
        mfaEnabled: true,
        lastLoginAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        rbac: createRBAC('admin' as UserRole, user.id),
      };

      return defaultProfile;
    }

    console.log('Found user profile in database:', profile.id);

    const authUser: AuthUser = {
      id: profile.id,
      email: profile.email,
      role: profile.role as UserRole,
      firstName: profile.first_name,
      lastName: profile.last_name,
      mfaEnabled: profile.mfa_enabled,
      lastLoginAt: profile.last_login_at ? new Date(profile.last_login_at) : undefined,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
      rbac: createRBAC(profile.role as UserRole, profile.id),
    };

    return authUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication and return user or redirect
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}

/**
 * Check if user has specific role
 */
export function hasRole(user: AuthUser, role: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    inspector: 1,
    officer: 2,
    manager: 3,
    admin: 4,
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[role];
}

/**
 * Check if user can perform action
 */
export function canPerformAction(
  user: AuthUser,
  action: string,
  resource: string,
  context?: Record<string, any>
): boolean {
  return user.rbac.can(action, resource, context);
}

/**
 * Get user's scope for data access
 */
export function getUserScope(user: AuthUser): 'own' | 'team' | 'org' | 'system' {
  switch (user.role) {
    case 'inspector':
      return 'own';
    case 'officer':
      return 'team';
    case 'manager':
      return 'org';
    case 'admin':
      return 'system';
    default:
      return 'own';
  }
}

/**
 * Generate MFA OTP
 */
export async function generateMFAToken(): Promise<string> {
  // Generate 6-digit OTP
  const otp = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return otp;
}

/**
 * Store MFA session temporarily
 */
export async function storeMFASession(userId: string, otp: string, request?: Request): Promise<void> {
  const supabase = createSupabaseAdminClient();
  
  // Generate expiry time (2 minutes from now)
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
  
  // Get IP address and user agent if request is available
  let ipAddress = null;
  let userAgent = null;
  
  if (request) {
    ipAddress = request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                '127.0.0.1';
    userAgent = request.headers.get('user-agent') || null;
  }
  
  // First, invalidate any existing active MFA sessions for this user
  // This ensures only one valid code exists at a time
  await supabase
    .from('mfa_sessions')
    .delete()
    .eq('user_id', userId);
  
  // Store new MFA session in database
  const { error } = await supabase
    .from('mfa_sessions')
    .insert({
      user_id: userId,
      token: otp,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent
    });
    
  if (error) {
    console.error('Failed to store MFA session:', error);
    throw new Error('Failed to store MFA session');
  }
}

/**
 * Verify MFA OTP
 */
export async function verifyMFAToken(userId: string, otp: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  
  // Find valid, unused MFA session
  const { data, error } = await supabase
    .from('mfa_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('token', otp)
    .gt('expires_at', new Date().toISOString())
    .is('used_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  if (error || !data) {
    console.log('MFA verification failed: Invalid or expired token');
    return false;
  }
  
  // Mark the session as used
  const { error: updateError } = await supabase
    .from('mfa_sessions')
    .update({ used_at: new Date().toISOString() })
    .eq('id', data.id);
    
  if (updateError) {
    console.error('Failed to mark MFA session as used:', updateError);
  }
  
  // Clean up expired sessions for this user
  await supabase
    .from('mfa_sessions')
    .delete()
    .eq('user_id', userId)
    .lt('expires_at', new Date().toISOString());
    
  return true;
}

/**
 * Clean up expired MFA sessions
 */
export async function cleanupExpiredMFASessions(): Promise<void> {
  const supabase = createSupabaseServerClient();
  
  const { error } = await supabase
    .from('mfa_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());
    
  if (error) {
    console.error('Failed to cleanup expired MFA sessions:', error);
  }
}

/**
 * Update user's last login time
 */
export async function updateLastLogin(userId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  
  await supabase
    .from('users')
    .update({ 
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
}

/**
 * Check if user has completed MFA setup
 */
export async function isMFAEnabled(userId: string): Promise<boolean> {
  // Use admin client to bypass RLS when checking MFA status
  const supabase = createSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('mfa_enabled')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.log('Error checking MFA status:', error?.message);
    return false;
  }

  return data.mfa_enabled;
}

/**
 * Enable MFA for user
 */
export async function enableMFA(userId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  
  await supabase
    .from('users')
    .update({ 
      mfa_enabled: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
}

/**
 * Disable MFA for user
 */
export async function disableMFA(userId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  
  await supabase
    .from('users')
    .update({ 
      mfa_enabled: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role as UserRole,
    firstName: data.first_name,
    lastName: data.last_name,
    mfaEnabled: data.mfa_enabled,
    lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Create new user
 */
export async function createUser(userData: {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  mfaEnabled?: boolean;
}): Promise<User> {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userData.id,
      email: userData.email,
      role: userData.role,
      first_name: userData.firstName,
      last_name: userData.lastName,
      mfa_enabled: userData.mfaEnabled || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role as UserRole,
    firstName: data.first_name,
    lastName: data.last_name,
    mfaEnabled: data.mfa_enabled,
    lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Update user profile
 */
export async function updateUser(userId: string, updates: {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}): Promise<User> {
  const supabase = createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('users')
    .update({
      first_name: updates.firstName,
      last_name: updates.lastName,
      role: updates.role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role as UserRole,
    firstName: data.first_name,
    lastName: data.last_name,
    mfaEnabled: data.mfa_enabled,
    lastLoginAt: data.last_login_at ? new Date(data.last_login_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * Get all users with pagination
 */
export async function getUsers(
  page: number = 1,
  limit: number = 50,
  role?: UserRole
): Promise<{ users: User[]; total: number; totalPages: number }> {
  const supabase = createSupabaseServerClient();
  
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' });

  if (role) {
    query = query.eq('role', role);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    throw new Error(`Failed to get users: ${error.message}`);
  }

  const users = data?.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role as UserRole,
    firstName: user.first_name,
    lastName: user.last_name,
    mfaEnabled: user.mfa_enabled,
    lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : undefined,
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  })) || [];

  return {
    users,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
}
