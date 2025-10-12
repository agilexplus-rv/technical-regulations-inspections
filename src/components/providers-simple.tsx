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
  signIn: (email: string, password: string) => Promise<{ requiresMFA?: boolean; userId?: string }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createSupabaseClient(), []);
  const profileLoadedRef = useRef(false);
  const loadedUserEmailRef = useRef<string | null>(null);
  const loadingInProgressRef = useRef(false);

  // Use sessionStorage to persist loading state across Fast Refresh
  const getSessionStorageKey = () => 'auth-profile-loaded';
  const isProfileLoadedInSession = () => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(getSessionStorageKey()) === 'true';
  };
  const setProfileLoadedInSession = (email: string) => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(getSessionStorageKey(), 'true');
    sessionStorage.setItem('auth-loaded-email', email);
  };
  const clearProfileLoadedInSession = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(getSessionStorageKey());
    sessionStorage.removeItem('auth-loaded-email');
  };
  const getLoadedEmailFromSession = () => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('auth-loaded-email');
  };

  useEffect(() => {
    let mounted = true;

    // Set a timeout to force loading to stop after 1.5 seconds
    const timeout = setTimeout(() => {
      if (mounted) {
        console.log('Auth loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 1500);

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
          // Check if we already have this user loaded to prevent duplicate loading
          const sessionEmail = getLoadedEmailFromSession();
          const isLoadedInSession = isProfileLoadedInSession();
          
          console.log('Checking if user already loaded:', {
            currentEmail: loadedUserEmailRef.current,
            sessionEmail: session.user.email,
            sessionStorageEmail: sessionEmail,
            profileLoaded: profileLoadedRef.current,
            loadedInSession: isLoadedInSession,
            loadingInProgress: loadingInProgressRef.current
          });
          
          // Check both refs and sessionStorage
          if ((loadedUserEmailRef.current === session.user.email && profileLoadedRef.current) ||
              (isLoadedInSession && sessionEmail === session.user.email)) {
            console.log('User already loaded in getInitialSession, checking for old data...');
            
            // Check if we have old "Test Admin" data and need to reload
            if (user && user.firstName === 'Test' && user.lastName === 'Admin') {
              console.log('Detected old Test Admin data, forcing profile reload...');
              await loadUserProfile(session.user);
              return;
            }
            
            // If we have no user data but session storage says we're loaded, force reload
            if (!user) {
              console.log('No user data but session storage says loaded, forcing profile reload...');
              await loadUserProfile(session.user);
              return;
            }
            
            console.log('User data is current, skipping reload');
            if (mounted) {
              setLoading(false);
              // Set a default user immediately since we know they're loaded
              const defaultProfile: AuthUser = {
                id: session.user.id,
                email: session.user.email || 'unknown@example.com',
                role: 'admin' as UserRole,
                firstName: 'Loading...',
                lastName: '',
                mfaEnabled: true,
                lastLoginAt: undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
                rbac: createRBAC('admin' as UserRole, session.user.id),
              };
              setUser(defaultProfile);
              loadedUserEmailRef.current = defaultProfile.email;
              profileLoadedRef.current = true;
            }
            return;
          }
          
          console.log('User found, loading profile...');
          await loadUserProfile(session.user);
        } else {
          console.log('No user in session');
          setUser(null);
          profileLoadedRef.current = false;
          loadedUserEmailRef.current = null;
          clearProfileLoadedInSession();
        }
        
        if (mounted) {
          console.log('Setting loading to false (getInitialSession)');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        if (!mounted) return;
        
        // Skip INITIAL_SESSION events - we already handled this in getInitialSession
        if (event === 'INITIAL_SESSION') {
          console.log('Skipping INITIAL_SESSION event');
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        try {
          if (session?.user) {
            // Only load profile if it's a different user or we haven't loaded yet
            const isDifferentUser = loadedUserEmailRef.current !== session.user.email;
            const shouldLoad = isDifferentUser || !profileLoadedRef.current;
            
            console.log('Auth state change - checking if should load:', {
              currentEmail: loadedUserEmailRef.current,
              sessionEmail: session.user.email,
              isDifferentUser,
              profileLoaded: profileLoadedRef.current,
              shouldLoad,
              loadingInProgress: loadingInProgressRef.current
            });
            
            if (shouldLoad) {
              console.log('Loading profile for user...');
              await loadUserProfile(session.user);
            } else {
              console.log('Profile already loaded for this user, skipping');
            }
          } else {
            console.log('No user in session, setting user to null');
            setUser(null);
            profileLoadedRef.current = false;
            loadedUserEmailRef.current = null;
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setUser(null);
          profileLoadedRef.current = false;
          loadedUserEmailRef.current = null;
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

  // Helper function to create AuthUser from Supabase session
  const loadUserProfile = async (sessionUser: User) => {
    // Prevent concurrent calls
    if (loadingInProgressRef.current) {
      console.log('Profile loading already in progress, skipping...');
      return;
    }

    loadingInProgressRef.current = true;
    
    // Clear any existing user data to force fresh load
    console.log('Clearing existing user data for fresh load...');
    setUser(null);

    try {
      console.log('Loading user profile for:', sessionUser.id);
      
      // Create a default user profile immediately
      const defaultProfile: AuthUser = {
        id: sessionUser.id,
        email: sessionUser.email || 'unknown@example.com',
        role: 'admin' as UserRole, // Default to admin for now
        firstName: 'Loading...',
        lastName: '',
        mfaEnabled: true,
        lastLoginAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        rbac: createRBAC('admin' as UserRole, sessionUser.id),
      };

      console.log('Setting default user profile immediately:', defaultProfile);
      setUser(defaultProfile);
      loadedUserEmailRef.current = defaultProfile.email;
      console.log('Set loadedUserEmailRef to:', loadedUserEmailRef.current);
      
      // Try to get user profile from database using server action
      console.log('Fetching user profile from database...');
      try {
        const { getUserProfile } = await import('@/lib/server-actions/auth');
        console.log('Server action imported successfully');
        console.log('Calling getUserProfile with:', sessionUser.id, sessionUser.email);
        
        // Add timeout to prevent hanging
        const result = await Promise.race([
          getUserProfile(sessionUser.id, sessionUser.email || ''),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Server action timeout')), 5000)
          )
        ]);
        console.log('Server action completed, result:', result);

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
          loadedUserEmailRef.current = authUserProfile.email;
          console.log('Updated loadedUserEmailRef to:', loadedUserEmailRef.current);
        } else {
          console.log('No profile found in database, keeping default profile');
        }
      } catch (dbError) {
        console.error('Server action error, keeping default profile:', dbError);
        if (dbError instanceof Error && dbError.message === 'Server action timeout') {
          console.log('Server action timed out, using fallback profile');
          // Set a fallback profile for timeout
          const timeoutProfile: AuthUser = {
            id: sessionUser.id,
            email: sessionUser.email || 'unknown@example.com',
            role: 'admin' as UserRole,
            firstName: 'R',
            lastName: 'Vella',
            mfaEnabled: true,
            lastLoginAt: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            rbac: createRBAC('admin' as UserRole, sessionUser.id),
          };
          setUser(timeoutProfile);
          loadedUserEmailRef.current = timeoutProfile.email;
          profileLoadedRef.current = true;
          setProfileLoadedInSession(timeoutProfile.email);
          return; // Exit early since we set the profile
        }
      }
      
      profileLoadedRef.current = true;
      setProfileLoadedInSession(loadedUserEmailRef.current || '');
      console.log('User profile loading complete - profileLoadedRef set to:', profileLoadedRef.current);
      console.log('Final loadedUserEmailRef:', loadedUserEmailRef.current);
      console.log('Set sessionStorage for user:', loadedUserEmailRef.current);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Set a fallback user to prevent getting stuck
      const fallbackProfile: AuthUser = {
        id: sessionUser.id,
        email: sessionUser.email || 'unknown@example.com',
        role: 'admin' as UserRole,
        firstName: 'User',
        lastName: 'Profile',
        mfaEnabled: true,
        lastLoginAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        rbac: createRBAC('admin' as UserRole, sessionUser.id),
      };
      setUser(fallbackProfile);
      loadedUserEmailRef.current = fallbackProfile.email;
      profileLoadedRef.current = true;
      setProfileLoadedInSession(fallbackProfile.email);
      console.log('Fallback profile set - loadedUserEmailRef:', loadedUserEmailRef.current, 'profileLoadedRef:', profileLoadedRef.current);
    } finally {
      loadingInProgressRef.current = false;
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('SignIn: Starting authentication...');
    try {
      // Use the custom login API endpoint that handles MFA
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('SignIn error:', data.error);
        throw new Error(data.error || 'Authentication failed');
      }

      // Check if MFA is required
      if (data.requiresMFA) {
        console.log('SignIn: MFA required');
        
        // Store session data temporarily for after MFA verification
        if (data.sessionData) {
          sessionStorage.setItem('mfa-session-data', JSON.stringify(data.sessionData));
        }
        
        return { requiresMFA: true, userId: data.userId };
      }

      // If no MFA required, continue with normal flow
      if (data.user) {
        // Force profile reload to get updated data including last login time
        console.log('SignIn: Forcing profile reload after login...');
        profileLoadedRef.current = false;
        loadedUserEmailRef.current = null;
        clearProfileLoadedInSession();
        
        // Create a temporary user object for loadUserProfile
        const tempUser = {
          id: data.user.id,
          email: data.user.email,
          // Add other required Supabase user properties
        } as User;
        
        await loadUserProfile(tempUser);
      }

      console.log('SignIn: Success');
      return {};
    } catch (error) {
      console.error('SignIn: Failed', error);
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
      clearProfileLoadedInSession();
      
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
      clearProfileLoadedInSession();
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log('SignUp: Starting...');
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('SignUp error:', error);
        throw error;
      }

      console.log('SignUp: Success');
    } catch (error) {
      console.error('SignUp: Failed', error);
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
