import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { sendInvitationEmail } from '../services/sesEmailService';

interface AuthContextType {
  user: User | null;
  partner: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  acceptInvitation: (token: string, password: string, name: string) => Promise<{ error: Error | null }>;
  invitePartner: (email: string) => Promise<{ error: Error | null; data?: { token: string; invitationUrl: string } }>;
  disconnectPartner: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await loadUserProfile(authUser.id);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setPartner(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profile) {
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name || undefined,
          partnerId: profile.partner_id || undefined,
        });

        // Load partner if exists
        if (profile.partner_id) {
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profile.partner_id)
            .single();

          if (partnerProfile) {
            setPartner({
              id: partnerProfile.id,
              email: partnerProfile.email,
              name: partnerProfile.name || undefined,
              partnerId: partnerProfile.partner_id || undefined,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        await loadUserProfile(data.user.id);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setPartner(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        return { error: authError };
      }

      if (!authData.user) {
        return { error: new Error('No user returned from signup') };
      }

      // Create profile - THIS IS WHERE THE RLS BUG OCCURS
      // The new user might not have permission to insert into profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          name,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // If profile creation fails with RLS error, we should handle it
        if (profileError.code === '42501') {
          return { 
            error: new Error(
              'No se pudo crear el perfil. Error de permisos (RLS). ' +
              'Por favor, contacta al administrador.'
            ) 
          };
        }
        return { error: profileError };
      }

      await loadUserProfile(authData.user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const acceptInvitation = useCallback(async (token: string, password: string, name: string) => {
    try {
      // FIX (Bug #1 — RLS 42501):
      // En lugar de hacer el signup + insert de profile directamente desde el cliente
      // (lo que falla con error 42501 de RLS porque el nuevo usuario no tiene permiso
      // de INSERT en la tabla profiles), delegamos toda la lógica a una Edge Function
      // que corre en el servidor con service_role y puede bypassear el RLS.
      //
      // La Edge Function 'accept-invitation':
      //   1. Valida el token de invitación
      //   2. Crea el usuario en auth.users con admin.createUser()
      //   3. Crea el perfil en profiles con service_role (sin RLS)
      //   4. Actualiza la invitación a 'accepted'
      //   5. Enlaza los partner_id de ambos usuarios
      const { data, error: fnError } = await supabase.functions.invoke('accept-invitation', {
        body: { token, password, name },
      });

      if (fnError) {
        console.error('Error en Edge Function accept-invitation:', fnError);
        return { error: fnError };
      }

      // La función devuelve el userId del nuevo usuario para cargar su perfil
      const userId = data?.userId;
      if (userId) {
        await loadUserProfile(userId);
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, []);

  const invitePartner = useCallback(async (email: string) => {
    try {
      if (!user?.id) {
        return { error: new Error('You must be logged in to invite a partner') };
      }

      // Generate a unique token
      const token = crypto.randomUUID();
      
      // Create invitation in database
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          token,
          inviter_id: user.id,
          email: email.trim().toLowerCase(),
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (inviteError) {
        return { error: inviteError };
      }

      // Get the base URL from environment variable or fallback
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const invitationUrl = `${baseUrl}/invitation/${token}`;

      // Enviar email de invitación vía EmailJS
      try {
        const emailResult = await sendInvitationEmail({
          toEmail: email.trim().toLowerCase(),
          inviterName: user.name || user.email || 'Tu pareja',
          invitationUrl,
        });
        if (!emailResult.success) {
          console.warn('EmailJS: email no enviado, pero la invitación fue creada:', emailResult.error);
        }
      } catch (emailErr) {
        // El fallo del email no bloquea la creación de la invitación
        console.warn('Error enviando email de invitación:', emailErr);
      }

      return { 
        error: null, 
        data: { 
          token, 
          invitationUrl 
        } 
      };
    } catch (error) {
      return { error: error as Error };
    }
  }, [user]);

  const disconnectPartner = useCallback(async () => {
    try {
      if (!user?.id || !partner?.id) {
        return { error: new Error('No partner to disconnect from') };
      }

      // Remove partner_id from current user
      const { error: userError } = await supabase
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', user.id);

      if (userError) {
        return { error: userError };
      }

      // Remove partner_id from partner
      const { error: partnerError } = await supabase
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', partner.id);

      if (partnerError) {
        return { error: partnerError };
      }

      // Update local state
      setPartner(null);
      if (user) {
        setUser({ ...user, partnerId: undefined });
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [user, partner]);

  return (
    <AuthContext.Provider
      value={{
        user,
        partner,
        isLoading,
        login,
        logout,
        register,
        acceptInvitation,
        invitePartner,
        disconnectPartner,
      }}
    >
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
