/**
 * useSupabaseAuth Hook
 * Custom hook for Supabase authentication
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../domain/entities/User';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  partnerId?: string;
  hasPartner: boolean;
}

interface AuthError {
  message: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: AuthError | null;
}

export const useSupabaseAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Fetch user profile from Supabase
  const fetchUserProfile = useCallback(async (userId: string): Promise<AuthUser | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        partnerId: data.partner_id,
        hasPartner: !!data.partner_id,
      };
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          const profile = await fetchUserProfile(authUser.id);
          setState({
            user: profile,
            loading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            loading: false,
            error: null,
          });
        }
      } catch (err) {
        setState({
          user: null,
          loading: false,
          error: { message: (err as Error).message },
        });
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setState({
            user: profile,
            loading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // Sign in
  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setState({
          user: profile,
          loading: false,
          error: null,
        });
      }

      return { error: null };
    } catch (err) {
      return { error: { message: (err as Error).message } };
    }
  };

  // Sign up
  const signUp = async (email: string, password: string, name?: string): Promise<{ error: AuthError | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (err) {
      return { error: { message: (err as Error).message } };
    }
  };

  // Sign out
  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setState({
      user: null,
      loading: false,
      error: null,
    });
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    signIn,
    signUp,
    signOut,
  };
};

export default useSupabaseAuth;
