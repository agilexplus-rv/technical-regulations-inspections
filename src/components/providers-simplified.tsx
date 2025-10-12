"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
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
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
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
          console.log('User found, creating profile from metadata...');
          const authUser = createAuthUserFromSession(session.user);
          setUser(authUser);
        } else {
          console.log('No user in session');
          setUser(null);
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
        
        try {
          if (session?.user) {
            console.log('User found in session, creating profile from metadata...');
            const authUser = createAuthUserFromSession(session.user);
            setUser(authUser);
          } else {
            console.log('No user in session, setting user to null');
            setUser(null);
          }
        } catch (error) {
          console.error('Error in auth state change:', error);
          setUser(null);
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
  const createAuthUserFromSession = (sessionUser: User): AuthUser => {
    const metadata = sessionUser.user_metadata || {};
    
    return {
      id: sessionUser.id,
      email: sessionUser.email || 'unknown@example.com',
      role: (metadata.role as UserRole) || 'inspector',
      firstName: metadata.first_name || 'Unknown',
      lastName: metadata.last_name || 'User',
      mfaEnabled: metadata.mfa_enabled || false,
      lastLoginAt: metadata.last_login_at ? new Date(metadata.last_login_at) : undefined,
      createdAt: metadata.created_at ? new Date(metadata.created_at) : new Date(sessionUser.created_at),
      updatedAt: metadata.updated_at ? new Date(metadata.updated_at) : new Date(),
      rbac: createRBAC((metadata.role as UserRole) || 'inspector', sessionUser.id),
    };
  };

  const signIn = async (email: string, password: string) => {
    console.log('SignIn: Starting authentication...');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('SignIn error:', error);
        throw error;
      }

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
        // Note: This provider doesn't have profile loading, so we just log it
      }

      console.log('SignIn: Success');
    } catch (error) {
      console.error('SignIn: Failed', error);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('SignOut: Starting...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('SignOut error:', error);
        throw error;
      }
      console.log('SignOut: Success');
    } catch (error) {
      console.error('SignOut: Failed', error);
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

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signUp }}>
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
