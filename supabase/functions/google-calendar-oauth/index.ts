/**
 * Edge Function: google-calendar-oauth
 *
 * Handles the OAuth 2.0 PKCE callback for Google Calendar.
 * This function runs server-side with access to GOOGLE_CLIENT_SECRET,
 * which MUST NOT be exposed to the frontend.
 *
 * Flow:
 *  1. Frontend redirects user to Google OAuth
 *  2. Google redirects back to /auth/google/callback in the SPA
 *  3. SPA sends the authorization code + PKCE code_verifier to this function
 *  4. This function exchanges code for tokens (with client_secret)
 *  5. Tokens are encrypted and stored in calendar_connections table
 *  6. Returns the list of available Google Calendars to the frontend
 *
 * Environment secrets (set via `supabase secrets set`):
 *   GOOGLE_CLIENT_ID     — OAuth client ID
 *   GOOGLE_CLIENT_SECRET — OAuth client secret (never in frontend!)
 *   ENCRYPTION_KEY       — Key for pgp_sym_encrypt (min 16 chars)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDARS_URL = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

interface OAuthCallbackBody {
  code: string;
  code_verifier: string;
  redirect_uri: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primary?: boolean;
  accessRole: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // ─── 1. Authenticate the user via Supabase JWT ────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse(401, 'Missing or invalid Authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);

    if (authError || !user) {
      return errorResponse(401, 'Invalid or expired JWT');
    }

    const userId = user.id;

    // ─── 2. Parse and validate request body ──────────────────────────────────
    let body: OAuthCallbackBody;
    try {
      body = await req.json();
    } catch {
      return errorResponse(400, 'Invalid JSON body');
    }

    const { code, code_verifier, redirect_uri } = body;

    if (!code || !code_verifier || !redirect_uri) {
      return errorResponse(400, 'Missing required fields: code, code_verifier, redirect_uri');
    }

    // ─── 3. Exchange authorization code for tokens ────────────────────────────
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');

    if (!clientId || !clientSecret || !encryptionKey) {
      console.error('Missing required environment secrets');
      return errorResponse(500, 'Server configuration error');
    }

    const tokenParams = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri,
      grant_type: 'authorization_code',
      code_verifier,
    });

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    const tokenData: GoogleTokenResponse = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error('Google token exchange failed:', tokenData);
      return errorResponse(400, `Google OAuth error: ${tokenData.error_description ?? tokenData.error}`);
    }

    const { access_token, refresh_token, expires_in } = tokenData;
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // ─── 4. Fetch user's Google account info ──────────────────────────────────
    const userinfoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userinfo = await userinfoRes.json();
    const providerEmail = userinfo.email ?? '';

    // ─── 5. Fetch user's calendar list ────────────────────────────────────────
    const calListRes = await fetch(
      `${GOOGLE_CALENDARS_URL}?minAccessRole=reader`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const calListData = await calListRes.json();
    const rawCalendars: GoogleCalendarListEntry[] = calListData.items ?? [];

    const availableCalendars = rawCalendars.map((cal) => ({
      id: cal.id,
      name: cal.summary,
      color: cal.backgroundColor ?? '#4285F4',
      enabled: !!cal.primary, // Only enable primary calendar by default
    }));

    // ─── 6. Check for existing connection and upsert ─────────────────────────
    // Store tokens encrypted using pgcrypto via a DB function
    // We use a raw SQL call to leverage pgp_sym_encrypt
    const { error: upsertError } = await supabase.rpc('upsert_calendar_connection', {
      p_user_id: userId,
      p_provider: 'google',
      p_provider_account_email: providerEmail,
      p_access_token: access_token,
      p_refresh_token: refresh_token ?? null,
      p_token_expires_at: tokenExpiresAt,
      p_selected_calendars: JSON.stringify(availableCalendars),
      p_encryption_key: encryptionKey,
    });

    if (upsertError) {
      console.error('Failed to store calendar connection:', upsertError);
      return errorResponse(500, 'Failed to store calendar connection');
    }

    // ─── 7. Log the connection event ─────────────────────────────────────────
    await supabase.from('calendar_sync_log').insert({
      user_id: userId,
      sync_type: 'manual',
      direction: 'from_external',
      status: 'success',
      events_pulled: 0,
      metadata: { action: 'oauth_connect', provider: 'google' },
      completed_at: new Date().toISOString(),
    });

    // ─── 8. Return success ────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        provider: 'google',
        providerAccountEmail: providerEmail,
        availableCalendars,
        tokenExpiresAt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Unhandled error in google-calendar-oauth:', err);
    return errorResponse(500, 'Internal server error');
  }
});

// ─── Edge Function: refresh-token ─────────────────────────────────────────────
// This function is also registered as a separate endpoint but lives here for reference.
// A separate `google-calendar-refresh` function should call this logic on 401 responses.

export async function refreshGoogleToken(
  supabase: ReturnType<typeof createClient>,
  connectionId: string,
  encryptionKey: string
): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

  // Fetch encrypted refresh token from DB
  const { data, error } = await supabase
    .from('calendar_connections')
    .select('refresh_token, token_expires_at')
    .eq('id', connectionId)
    .single();

  if (error || !data) throw new Error('Connection not found');

  // Decrypt (must be done via a Postgres function due to pgcrypto)
  const { data: decrypted, error: decryptError } = await supabase.rpc(
    'decrypt_calendar_token',
    { p_encrypted_token: data.refresh_token, p_encryption_key: encryptionKey }
  );

  if (decryptError || !decrypted) throw new Error('Failed to decrypt token');

  const refreshParams = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: decrypted,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: refreshParams.toString(),
  });

  const { access_token, expires_in, error: tokenError } = await res.json();
  if (tokenError) throw new Error(`Token refresh failed: ${tokenError}`);

  // Update the access token in DB
  await supabase.rpc('update_calendar_access_token', {
    p_connection_id: connectionId,
    p_access_token: access_token,
    p_token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
    p_encryption_key: encryptionKey,
  });

  return access_token;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function errorResponse(status: number, message: string): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
