/**
 * Supabase Auth Repository
 * Implements IAuthRepository using Supabase OAuth
 */

import { Result, AsyncResult } from '../../shared/utils/Result';
import { DomainError, DatabaseError, UnauthorizedError } from '../../domain/errors/DomainError';
import { User } from '../../domain/entities/User';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { supabase } from '../../lib/supabase';

export class SupabaseAuthRepository implements IAuthRepository {
  /**
   * Initiate Google OAuth flow.
   * Supabase redirects the browser to Google; no return value needed.
   */
  async signInWithGoogle(): AsyncResult<void, DomainError> {
    try {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${appUrl}/auth/callback`,
          scopes: 'email profile',
        },
      });

      if (error) {
        return Result.fail(new DatabaseError(`Google OAuth error: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(
        new DatabaseError(`Unexpected error initiating Google login: ${(err as Error).message}`)
      );
    }
  }

  /**
   * Initiate Apple OAuth flow.
   * Supabase redirects the browser to Apple; no return value needed.
   *
   * NOTE: Apple requires:
   *   - Apple Developer Account ($99/year)
   *   - Service ID configured in Apple Developer Console
   *   - Supabase → Authentication → Providers → Apple → Enable
   *
   * For iOS Capacitor native builds, also add the "Sign In with Apple"
   * entitlement in Xcode → Signing & Capabilities → + Capability.
   */
  async signInWithApple(): AsyncResult<void, DomainError> {
    try {
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${appUrl}/auth/callback`,
        },
      });

      if (error) {
        return Result.fail(new DatabaseError(`Apple OAuth error: ${error.message}`));
      }

      return Result.ok(undefined);
    } catch (err) {
      return Result.fail(
        new DatabaseError(`Unexpected error initiating Apple login: ${(err as Error).message}`)
      );
    }
  }

  /**
   * Handle the OAuth redirect callback.
   * Supabase automatically parses the URL hash/params on session setup.
   * We just need to retrieve the current session after the redirect.
   */
  async handleOAuthCallback(_url?: string): AsyncResult<User, DomainError> {
    try {
      // Supabase automatically handles the URL hash when detectSessionInUrl is true.
      // We call getSession() to retrieve the established session.
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        return Result.fail(new UnauthorizedError(`Session error: ${sessionError.message}`));
      }

      if (!sessionData?.session?.user) {
        return Result.fail(new UnauthorizedError('No valid session in callback URL'));
      }

      const authUser = sessionData.session.user;

      // Try to load existing profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        return Result.fail(new DatabaseError(`Failed to load profile: ${profileError.message}`));
      }

      // If profile doesn't exist, create it (first-time OAuth user)
      if (!profile) {
        const name =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] ||
          'User';

        const { error: insertError } = await supabase.from('profiles').insert({
          id: authUser.id,
          email: authUser.email!,
          name,
        });

        if (insertError) {
          return Result.fail(new DatabaseError(`Failed to create profile: ${insertError.message}`));
        }

        const user = User.reconstitute({
          id: authUser.id,
          email: authUser.email!,
          name,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return Result.ok(user);
      }

      const user = User.reconstitute({
        id: profile.id,
        email: profile.email,
        name: profile.name || authUser.email!.split('@')[0],
        partnerId: profile.partner_id || undefined,
        createdAt: new Date(profile.created_at),
        updatedAt: new Date(profile.updated_at),
      });

      return Result.ok(user);
    } catch (err) {
      return Result.fail(
        new DatabaseError(`Unexpected error handling OAuth callback: ${(err as Error).message}`)
      );
    }
  }
}
