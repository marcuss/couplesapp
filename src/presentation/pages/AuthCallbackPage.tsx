/**
 * AuthCallbackPage
 * Handles the OAuth redirect from Google / Apple via Supabase.
 *
 * Flow:
 *  1. User completes OAuth at provider
 *  2. Provider redirects to this page with tokens in URL hash/params
 *  3. Supabase (detectSessionInUrl:true) parses the URL and sets the session
 *  4. This page calls handleOAuthCallback, gets the User, and redirects to /dashboard
 *  5. On error, redirects to /login with an error message
 *
 * iOS / Capacitor deep-link note:
 *  For native iOS builds, configure your deep link scheme (e.g. couplesapp://)
 *  in capacitor.config.ts and handle the App.appUrlOpen event so the URL
 *  is passed to the browser for session parsing. Xcode requires the "Associated
 *  Domains" and "Sign In with Apple" capabilities to be added manually.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const process = async () => {
      try {
        const result = await handleOAuthCallback(window.location.href);
        if (cancelled) return;

        if (result.error) {
          setError('No se pudo completar el inicio de sesión. Por favor, intentá de nuevo.');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch {
        if (!cancelled) {
          setError('Error inesperado. Redirigiendo...');
          setTimeout(() => navigate('/login'), 3000);
        }
      }
    };

    process();
    return () => {
      cancelled = true;
    };
  }, [handleOAuthCallback, navigate]);

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800"
        data-testid="auth-callback-error"
      >
        <Heart className="h-12 w-12 text-rose-300 mb-4" />
        <p className="text-red-600 dark:text-red-400 text-center px-4">{error}</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Redirigiendo a inicio de sesión…</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800"
      data-testid="auth-callback-loading"
    >
      <Heart className="h-12 w-12 text-rose-500 mb-4 animate-pulse" />
      <p className="text-gray-600 dark:text-gray-300 text-sm">Iniciando sesión…</p>
    </div>
  );
};

export default AuthCallbackPage;
