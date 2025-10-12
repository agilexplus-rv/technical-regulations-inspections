"use client";

import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { createSupabaseClient } from "@/lib/database/supabase";
import { User } from "@supabase/supabase-js";
import { AuthUser } from "@/lib/auth/auth";
import { createRBAC } from "@/lib/auth/rbac";
import { UserRole } from "@/types";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const profileLoadedRef = useRef(false);
  const currentUserRef = useRef<AuthUser | null>(null);
  const loadingInProgressRef = useRef(false);
  const loadedUserEmailRef = useRef<string | null>(null);
  const initializedRef = useRef(false);
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) {
      console.log('AuthProvider already initialized, skipping...');
      return;
    }
    
    initializedRef.current = true;
    let mounted = true;

    // Set a timeout to force loading to stop after 3 seconds
    const timeout = setTimeout(() => {
      if (mounted) {
        console.log('Auth loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 3000);

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) {
          console.log('Component unmounted during getInitialSession');
          return;
        }
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setLoading(false);
          return;
        }
        
        console.log('Session result:', session);
        
        if (session?.user) {
          console.log('User found, loading profile...');
          await loadUserProfile(session.user);
        } else {
          console.log('No user in session');
          setUser(null);
          currentUserRef.current = null;
          loadedUserEmailRef.current = null;
          profileLoadedRef.current = false;
        }
        
        if (mounted) {
          console.log('Setting loading to false (getInitialSession)');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setUser(null);
          currentUserRef.current = null;
          setLoading(false);
        }
      }
    };

    getInitialSession();
    
    // Force reload user profile if we have old "Test Admin" data
    setTimeout(() => {
      if (user && user.firstName === 'Test' && user.lastName === 'Admin') {
        console.log('Detected old Test Admin data, forcing profile reload...');
        const session = supabase.auth.getSession();
        session.then(({ data: { session } }) => {
          if (session?.user) {
            loadUserProfile(session.user);
          }
        });
      }
    }, 1000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        console.log('Current pathname:', window.location.pathname);
        if (!mounted) return;
        
        // Skip INITIAL_SESSION events if we already have a user loaded with correct data
        if (event === 'INITIAL_SESSION' && user && session?.user?.email === loadedUserEmailRef.current) {
          // Check if the current user still has "Test Admin" data - if so, reload the profile
          if (user.firstName === 'Test' && user.lastName === 'Admin') {
            console.log('User has old Test Admin data, reloading profile...');
            await loadUserProfile(session.user);
          } else {
            console.log('Skipping INITIAL_SESSION - user already loaded with correct data');
            if (mounted) {
              setLoading(false);
            }
            return;
          }
        }
        
        try {
          if (session?.user) {
            // Only load profile if it's a different user (by email), we haven't loaded yet, or not currently loading
            const isDifferentUser = loadedUserEmailRef.current !== session.user.email;
            const shouldLoad = (isDifferentUser || !profileLoadedRef.current) && !loadingInProgressRef.current;
            
            if (shouldLoad) {
              console.log('Loading profile for user...');
              await loadUserProfile(session.user);
            } else {
              console.log(`Profile already loaded or loading for user ${session.user.email}, skipping... (different: ${isDifferentUser}, loaded: ${profileLoadedRef.current}, loading: ${loadingInProgressRef.current})`);
            }
          } else {
            console.log('No user in session, setting user to null');
            setUser(null);
            currentUserRef.current = null;
            loadedUserEmailRef.current = null;
            profileLoadedRef.current = false;
            loadingInProgressRef.current = false;
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setUser(null);
          currentUserRef.current = null;
          loadedUserEmailRef.current = null;
          profileLoadedRef.current = false;
          loadingInProgressRef.current = false;
        }
        
        // Always set loading to false after auth state change
        if (mounted) {
          console.log('Setting loading to false after auth state change');
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [supabase]);

  const loadUserProfile = async (authUser: User) => {
    // Simple check to prevent concurrent calls
    if (loadingInProgressRef.current) {
      console.log('Profile loading already in progress, skipping...');
      return;
    }
    
    loadingInProgressRef.current = true;
    
    // Clear any existing user data to force fresh load
    console.log('Clearing existing user data for fresh load...');
    setUser(null);
    currentUserRef.current = null;
    
    try {
      console.log('Loading user profile for:', authUser.id);
      
      // Create a default user profile immediately to prevent timeout
      const defaultProfile: AuthUser = {
        id: authUser.id,
        email: authUser.email || 'unknown@example.com',
        role: 'admin' as UserRole, // Default to admin for now
        firstName: 'Loading...',
        lastName: '',
        mfaEnabled: true,
        lastLoginAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        rbac: createRBAC('admin' as UserRole, authUser.id),
      };

      console.log('Setting default user profile immediately:', defaultProfile);
      setUser(defaultProfile);
      currentUserRef.current = defaultProfile;
      
      // Try to get user profile from database using server action
      console.log('Fetching user profile from database...');
      try {
        const { getUserProfile } = await import('@/lib/server-actions/auth');
        console.log('Server action imported successfully');
        const result = await getUserProfile(authUser.id, authUser.email || '');
        console.log('Server action called, result:', result);

        console.log('Server action result:', { success: result.success, error: result.error });

        if (result.success && result.profile) {
          console.log('Found user profile in database, updating:', result.profile);
          
          // Create user profile from database data
          const authUserProfile: AuthUser = {
            id: result.profile.id,
            email: result.profile.email,
            role: result.profile.role as UserRole,
            firstName: result.profile.firstName,
            lastName: result.profile.lastName,
            mfaEnabled: result.profile.mfaEnabled,
            lastLoginAt: result.profile.lastLoginAt,
            createdAt: result.profile.createdAt,
            updatedAt: result.profile.updatedAt,
            rbac: createRBAC(result.profile.role as UserRole, result.profile.id),
          };

          console.log('Updating user profile from database:', authUserProfile);
          setUser(authUserProfile);
          currentUserRef.current = authUserProfile;
          loadedUserEmailRef.current = authUserProfile.email;
          profileLoadedRef.current = true;
        } else {
          console.log('No profile found in database, keeping default profile');
          loadedUserEmailRef.current = defaultProfile.email;
          profileLoadedRef.current = true;
        }
      } catch (dbError) {
        console.error('Server action error, keeping default profile:', dbError);
        loadedUserEmailRef.current = defaultProfile.email;
        profileLoadedRef.current = true;
      }
      
      console.log('User profile loading complete');
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Set a fallback user to prevent getting stuck
      const fallbackProfile: AuthUser = {
        id: authUser.id,
        email: authUser.email || 'unknown@example.com',
        role: 'admin' as UserRole,
        firstName: 'User',
        lastName: 'Profile',
        mfaEnabled: true,
        lastLoginAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        rbac: createRBAC('admin' as UserRole, authUser.id),
      };
      setUser(fallbackProfile);
      currentUserRef.current = fallbackProfile;
      loadedUserEmailRef.current = fallbackProfile.email;
      profileLoadedRef.current = true;
    } finally {
      loadingInProgressRef.current = false;
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('SignIn: Starting authentication...');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw new Error(error.message || 'Failed to sign in');
      }

      console.log('SignIn: Authentication successful, loading profile...');
      if (data.user) {
        // Update last login time after successful authentication
        try {
          const response = await fetch('/api/auth/update-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: data.user.id }),
          });

          if (!response.ok) {
            console.warn('Failed to update last login time');
          }
        } catch (updateError) {
          console.warn('Error updating last login time:', updateError);
        }

        // Force profile reload to get updated data including last login time
        console.log('SignIn: Forcing profile reload after login...');
        profileLoadedRef.current = false;
        loadedUserEmailRef.current = null;
        
        // Load user profile after successful authentication
        await loadUserProfile(data.user);
        console.log('SignIn: Profile loaded, sign in complete');
      }
    } catch (error) {
      console.error('SignIn: Error during sign in process:', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('SignOut: Starting...');
    try {
      // Always reset local state first
      setUser(null);
      profileLoadedRef.current = false;
      loadedUserEmailRef.current = null;
      loadingInProgressRef.current = false;
      
      // Try to sign out from Supabase, but don't fail if session is already missing
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.warn('SignOut warning (session may already be cleared):', error.message);
          // Don't throw error for session missing - this is expected in some cases
        } else {
          console.log('SignOut: Success');
        }
      } catch (signOutError) {
        console.warn('SignOut warning (session may already be cleared):', signOutError);
        // Don't throw error - continue with local cleanup
      }
      
    } catch (error) {
      console.error('SignOut: Failed', error);
      // Even if signOut fails, we should still clear local state
      setUser(null);
      profileLoadedRef.current = false;
      loadedUserEmailRef.current = null;
      loadingInProgressRef.current = false;
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    signUp,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
