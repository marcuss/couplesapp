/**
 * GoogleOAuthButton
 * Initiates the Google Calendar OAuth 2.0 PKCE flow.
 * Generates a code_verifier, builds the authorization URL, and redirects the user.
 */

import React, { useState } from 'react';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
].join(' ');

interface GoogleOAuthButtonProps {
  /** Callback invoked immediately before redirect (useful for analytics/logging) */
  onInitiate?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Generate a cryptographically random code verifier for PKCE
 */
function generateCodeVerifier(length = 128): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) =>
    ('0' + (byte & 0xff).toString(16)).slice(-2)
  ).join('');
}

/**
 * Generate SHA-256 code challenge from verifier
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onInitiate,
  disabled = false,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    onInitiate?.();

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

      if (!clientId) {
        console.error('VITE_GOOGLE_CLIENT_ID is not set');
        alert('Google Calendar integration is not configured yet. Please contact support.');
        setIsLoading(false);
        return;
      }

      // Generate PKCE pair
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store verifier in sessionStorage (needed for callback)
      sessionStorage.setItem('google_oauth_code_verifier', codeVerifier);

      // Build authorization URL
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri ?? `${window.location.origin}/auth/google/callback`,
        response_type: 'code',
        scope: SCOPES,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'consent', // Force refresh_token on every connect
      });

      const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      console.error('Failed to initiate Google OAuth:', err);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleConnect}
      disabled={disabled || isLoading}
      className={`
        flex items-center gap-3 px-4 py-3 
        bg-white dark:bg-gray-800 
        border border-gray-300 dark:border-gray-600 
        rounded-lg shadow-sm 
        hover:bg-gray-50 dark:hover:bg-gray-700 
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors font-medium text-gray-700 dark:text-gray-200
        ${className}
      `.trim()}
      aria-label="Conectar Google Calendar"
    >
      {isLoading ? (
        <svg
          className="w-5 h-5 animate-spin text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        /* Google logo SVG */
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 shrink-0"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      <span>
        {isLoading ? 'Conectando...' : 'Conectar Google Calendar'}
      </span>
    </button>
  );
};

export default GoogleOAuthButton;
