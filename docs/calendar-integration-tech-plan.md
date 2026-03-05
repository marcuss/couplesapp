# Technical Plan: Calendar Integration — CouplePlan

**Version:** 1.0  
**Date:** March 2026  
**Author:** Engineering Team  
**Status:** Ready for implementation

---

## 1. Architecture Overview

### The Core Problem: OAuth in a SPA

A Single Page Application (SPA) like CouplePlan cannot safely store OAuth `client_secret` in the frontend. The secret would be visible in browser devtools, source maps, or JS bundles — a critical security vulnerability.

**Solution: Supabase Edge Function as OAuth Proxy**

The Edge Function runs server-side in a Deno environment, safely holds `GOOGLE_CLIENT_SECRET` as an environment secret, handles the token exchange, and stores tokens encrypted in the Supabase database.

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE OAUTH FLOW                             │
└─────────────────────────────────────────────────────────────────┘

  [Browser / CouplePlan SPA]
         │
         │ 1. User clicks "Connect Google Calendar"
         │
         ▼
  [GoogleOAuthButton.tsx]
         │
         │ 2. Generate PKCE code_verifier + code_challenge
         │    Store code_verifier in sessionStorage
         │
         │ 3. Redirect to:
         │    https://accounts.google.com/o/oauth2/v2/auth
         │    ?client_id=VITE_GOOGLE_CLIENT_ID
         │    &redirect_uri=https://dlr56cmovhfn0.cloudfront.net/auth/google/callback
         │    &response_type=code
         │    &scope=https://www.googleapis.com/auth/calendar.events
         │    &code_challenge=<challenge>
         │    &code_challenge_method=S256
         │    &access_type=offline
         │    &prompt=consent
         │
         ▼
  [Google OAuth Server]
         │
         │ 4. User authorizes → Google redirects back with ?code=AUTH_CODE
         │
         ▼
  [/auth/google/callback route in React]
         │
         │ 5. Extract code from URL
         │    Retrieve code_verifier from sessionStorage
         │
         │ 6. POST to Supabase Edge Function:
         │    /functions/v1/google-calendar-oauth
         │    { code, code_verifier, user_id }
         │    Authorization: Bearer <supabase_jwt>
         │
         ▼
  [Supabase Edge Function: google-calendar-oauth]
         │
         │ 7. Validate JWT (user is authenticated)
         │
         │ 8. POST to https://oauth2.googleapis.com/token
         │    { code, code_verifier, client_secret, ... }
         │
         │ 9. Receive { access_token, refresh_token, expires_in }
         │
         │ 10. Encrypt tokens with pgcrypto
         │     INSERT INTO calendar_connections (user_id, provider, ...)
         │
         │ 11. Fetch list of user's Google Calendars
         │     INSERT INTO calendar_calendars (connection_id, google_id, name, ...)
         │
         ▼
  [Browser]
         │
         │ 12. Edge Function returns { success: true, calendars: [...] }
         │
         │ 13. React navigates to /settings/calendar
         │     Shows "Connected ✓" + calendar selection toggles
         └─────────────────────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────┐
│                    SYNC FLOW                                      │
└─────────────────────────────────────────────────────────────────┘

  [CouplePlan Event Created]
         │
         ▼
  [SyncCalendarEventsUseCase]
         │
         │ 1. Fetch active connections for user
         │ 2. For each active connection + selected calendar:
         │    POST event to Google Calendar API (via Edge Function)
         │    Store external_event_id in calendar_events_cache
         │
         ▼
  [Google Calendar Push Notification → Supabase Edge Function]
         │
         │ 1. Google sends webhook to:
         │    /functions/v1/google-calendar-webhook
         │
         │ 2. Edge Function validates X-Goog-Channel-Token
         │
         │ 3. Fetches changed events from Google API
         │
         │ 4. Upserts into calendar_events_cache
         │
         │ 5. Triggers realtime notification to client
         └─────────────────────────────────────────────────────────
```

---

## 2. Google Calendar Integration

### 2.1 Google Cloud Console Setup (Manual Steps)

> ⚠️ **Marcus must complete these steps manually** (see Section 7)

1. Go to https://console.cloud.google.com
2. Create project "CouplePlan"
3. Enable "Google Calendar API": APIs & Services → Enable APIs → search "Google Calendar API"
4. Create OAuth credentials: APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://dlr56cmovhfn0.cloudfront.net/auth/google/callback`
   - Also add: `http://localhost:5173/auth/google/callback` (for local dev)
5. Configure OAuth consent screen:
   - App name: CouplePlan
   - User support email: (your email)
   - Scopes: `https://www.googleapis.com/auth/calendar.events`
   - Test users: add your email(s) while in testing mode
6. Copy `Client ID` → set as `VITE_GOOGLE_CLIENT_ID` in `.env`
7. Copy `Client Secret` → set as `GOOGLE_CLIENT_SECRET` in Supabase secrets

### 2.2 OAuth Scopes

```
https://www.googleapis.com/auth/calendar.events
```

This scope allows:
- Reading events from selected calendars
- Creating events on behalf of the user
- Updating/deleting events created by CouplePlan
- **Does NOT** allow reading calendar settings, managing other users' calendars

For listing available calendars, we additionally need:
```
https://www.googleapis.com/auth/calendar.readonly
```

### 2.3 PKCE Flow for SPA

PKCE (Proof Key for Code Exchange) eliminates the need to expose `client_secret` in the frontend:

```typescript
// 1. Generate PKCE pair
const codeVerifier = generateRandomString(128); // stored in sessionStorage
const codeChallenge = base64url(sha256(codeVerifier));

// 2. Authorization URL
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
// ... other params

// 3. Token exchange (in Edge Function, with client_secret)
const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  body: new URLSearchParams({
    code,
    code_verifier: codeVerifier, // sent from frontend
    client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'), // only in Edge Function
    // ...
  })
});
```

### 2.4 Token Storage — Encrypted in Supabase

Tokens are stored in `calendar_connections` table encrypted using `pgcrypto`:

```sql
-- Store
UPDATE calendar_connections SET
  access_token = pgp_sym_encrypt(token, current_setting('app.encryption_key')),
  refresh_token = pgp_sym_encrypt(refresh, current_setting('app.encryption_key'))

-- Retrieve (only in Edge Function context)
SELECT pgp_sym_decrypt(access_token::bytea, current_setting('app.encryption_key'))
FROM calendar_connections WHERE user_id = $1;
```

The `app.encryption_key` is set via Supabase secrets, never exposed to the frontend.

### 2.5 Refresh Token Flow

Google access tokens expire in 1 hour. The Edge Function handles refresh automatically:

```typescript
async function getValidAccessToken(connectionId: string): Promise<string> {
  const connection = await getConnection(connectionId);
  
  if (connection.tokenExpiresAt > Date.now() + 5 * 60 * 1000) {
    return decryptToken(connection.accessToken); // still valid
  }
  
  // Refresh needed
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: decryptToken(connection.refreshToken),
      client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
    })
  });
  
  const { access_token, expires_in } = await response.json();
  await updateConnectionToken(connectionId, access_token, expires_in);
  return access_token;
}
```

### 2.6 Google Calendar Push Notifications (Webhooks)

For real-time sync (CouplePlan updated when user changes event in Google app):

```typescript
// Register webhook (called after OAuth connection)
POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events/watch
{
  "id": "channel-uuid",
  "type": "web_hook",
  "address": "https://klpshxvjzsdqolkrabvb.supabase.co/functions/v1/google-calendar-webhook",
  "token": "WEBHOOK_SECRET",
  "expiration": 1234567890000  // max 7 days, must be renewed
}
```

The webhook sends a notification whenever any event changes; the Edge Function then fetches the actual changes.

---

## 3. Apple Calendar Integration

### 3.1 Two Approaches

#### Option A: EventKit (iOS Native via Capacitor) ✅ RECOMMENDED for v1

**How it works:**
- Uses `@capacitor-community/calendar` plugin
- EventKit is the native iOS framework for calendar access
- No Apple credentials required — uses the device's local calendar store
- Permissions requested at runtime via iOS dialog

**Pros:**
- No server-side Apple credentials
- Works with iCloud sync automatically (Apple handles it)
- Standard iOS UX (users are familiar with the permission dialog)
- Can read AND write to local calendars

**Cons:**
- Only works in the Capacitor iOS app (not web)
- Requires Capacitor setup

#### Option B: CalDAV (Web + Any Platform)

**How it works:**
- CalDAV is an open protocol (RFC 4791) running over HTTPS
- Apple iCloud calendar is accessible at: `https://caldav.icloud.com`
- Requires Apple ID + App-Specific Password (not the main password)
- Server-side requests only (fetch from Edge Function)

**Pros:**
- Works in the web app
- Cross-platform

**Cons:**
- User must generate an App-Specific Password at appleid.apple.com
- Complex auth flow (not standard OAuth)
- Higher friction for users
- Apple's CalDAV implementation has some quirks

### 3.2 Recommendation

**v1: EventKit only (iOS Capacitor)**  
**v2: CalDAV for web** (when the web user base grows)

For v1, show "Apple Calendar" option only when running in the iOS Capacitor context, hide it on web with a tooltip: "Disponible próximamente en web. Descarga la app para iOS."

---

## 4. Database Schema

### New Tables

```sql
-- ============================================================================
-- CALENDAR_CONNECTIONS
-- One row per user per provider (user can connect one Google account)
-- ============================================================================
CREATE TABLE public.calendar_connections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider        text NOT NULL CHECK (provider IN ('google', 'apple')),
  provider_account_email text,          -- e.g. user@gmail.com (display only)
  access_token    text,                 -- pgp_sym_encrypt'd
  refresh_token   text,                 -- pgp_sym_encrypt'd
  token_expires_at timestamptz,
  is_active       boolean DEFAULT true,
  selected_calendars jsonb DEFAULT '[]'::jsonb,  -- array of calendar IDs to sync
  webhook_channel_id text,             -- Google push notification channel id
  webhook_expires_at timestamptz,
  last_synced_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- ============================================================================
-- CALENDAR_EVENTS_CACHE
-- Cache of external events (Google/Apple) for display in CouplePlan
-- Read-only from the app's perspective; refreshed by sync
-- ============================================================================
CREATE TABLE public.calendar_events_cache (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   uuid NOT NULL REFERENCES public.calendar_connections(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  external_id     text NOT NULL,        -- Google event ID or Apple UID
  calendar_id     text,                 -- Which calendar within the provider
  title           text NOT NULL,
  description     text,
  start_time      timestamptz NOT NULL,
  end_time        timestamptz,
  is_all_day      boolean DEFAULT false,
  location        text,
  color           text,                 -- from Google Calendar color
  provider        text NOT NULL CHECK (provider IN ('google', 'apple')),
  raw_data        jsonb,                -- full event payload for reference
  couplePlan_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  -- ^ if this external event was CREATED from CouplePlan, links back to source
  etag            text,                 -- for change detection (Google etag)
  synced_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(connection_id, external_id)
);

-- ============================================================================
-- CALENDAR_SYNC_LOG
-- Audit log of all sync operations
-- ============================================================================
CREATE TABLE public.calendar_sync_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   uuid REFERENCES public.calendar_connections(id) ON DELETE SET NULL,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sync_type       text NOT NULL CHECK (sync_type IN ('push', 'pull', 'webhook', 'manual')),
  direction       text NOT NULL CHECK (direction IN ('to_external', 'from_external', 'both')),
  status          text NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  events_pushed   integer DEFAULT 0,
  events_pulled   integer DEFAULT 0,
  conflicts_found integer DEFAULT 0,
  error_message   text,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);
```

### RLS Policies

```sql
-- calendar_connections: users can only see/edit their own
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON public.calendar_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
  ON public.calendar_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON public.calendar_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON public.calendar_connections FOR DELETE
  USING (auth.uid() = user_id);

-- calendar_events_cache: users can read own events and partner's events
ALTER TABLE public.calendar_events_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own and partner cached events"
  ON public.calendar_events_cache FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT partner_id FROM public.profiles WHERE id = user_id
    )
  );

CREATE POLICY "Service role can manage cache"
  ON public.calendar_events_cache FOR ALL
  USING (auth.role() = 'service_role');

-- calendar_sync_log: users can read own logs
ALTER TABLE public.calendar_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs"
  ON public.calendar_sync_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert logs"
  ON public.calendar_sync_log FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);
```

---

## 5. React Components

### New Components

```
src/
├── domain/
│   └── entities/
│       ├── CalendarConnection.ts       (new)
│       └── CalendarEvent.ts            (new)
├── domain/
│   └── repositories/
│       ├── ICalendarConnectionRepository.ts  (new)
│       └── ICalendarEventRepository.ts       (new)
├── application/
│   └── use-cases/
│       └── calendar/
│           ├── ConnectGoogleCalendarUseCase.ts   (new)
│           ├── DisconnectCalendarUseCase.ts       (new)
│           ├── SyncCalendarEventsUseCase.ts       (new)
│           └── GetUnifiedCalendarUseCase.ts       (new)
└── presentation/
    ├── pages/
    │   └── CalendarSettingsPage.tsx    (new)
    └── components/
        └── calendar/
            ├── GoogleOAuthButton.tsx         (new)
            ├── CalendarConnectionCard.tsx    (new)
            └── CalendarSourceLegend.tsx      (new)
```

### Modified Components

- `App.tsx`: Add route `/settings/calendar`
- `EventsPage.tsx`: Show external events with color coding, source filter
- `SettingsPage.tsx`: Add link/card to Calendar Integration settings

### `useCalendarSync` Hook

```typescript
// Hook for managing calendar sync state
export function useCalendarSync() {
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const connectGoogle = async () => { /* initiate OAuth flow */ };
  const disconnect = async (connectionId: string) => { /* disconnect */ };
  const syncNow = async () => { /* manual sync */ };
  const toggleCalendar = async (connectionId: string, calendarId: string) => { /* toggle */ };

  return { connections, isSyncing, lastSyncedAt, connectGoogle, disconnect, syncNow, toggleCalendar };
}
```

---

## 6. Time Estimation

| Phase | Description | Days |
|-------|-------------|------|
| **Phase 1 — Foundation** | Schema migration, domain entities, repository interfaces | 2 |
| **Phase 2 — OAuth Flow** | Edge Function, Google OAuth, token storage | 3 |
| **Phase 3 — Sync Engine** | Use cases, pull sync, conflict detection | 4 |
| **Phase 4 — UI** | Settings page, OAuth button, unified events view | 3 |
| **Phase 5 — Webhooks** | Real-time push from Google, webhook registration | 2 |
| **Phase 6 — Apple/iOS** | EventKit via Capacitor plugin | 2 |
| **Phase 7 — Testing & Polish** | Integration tests, edge cases, error states | 2 |
| **Total** | | **~18 days** |

---

## 7. ✅ Marcus's Manual Checklist

These steps **cannot be automated** and require Marcus to complete manually:

### Google Cloud Console (Priority: CRITICAL before testing OAuth)
- [ ] Go to https://console.cloud.google.com
- [ ] Create new project named "CouplePlan"
- [ ] Enable "Google Calendar API": APIs & Services → Library → search "Google Calendar API" → Enable
- [ ] Create OAuth 2.0 credentials:
  - APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
  - Application type: **Web application**
  - Name: "CouplePlan Web"
  - Authorized redirect URIs:
    - `https://dlr56cmovhfn0.cloudfront.net/auth/google/callback`
    - `http://localhost:5173/auth/google/callback`
- [ ] Configure OAuth consent screen:
  - User Type: External (for now)
  - App name: CouplePlan
  - Scopes: add `calendar.events` and `calendar.readonly`
  - Add your Gmail as test user
- [ ] Copy **Client ID** (looks like `12345-xxx.apps.googleusercontent.com`)
- [ ] Copy **Client Secret** (looks like `GOCSPX-xxx`)

### Environment Variables
- [ ] Set in `.env.local` (NOT in `.env` which is committed):
  ```
  VITE_GOOGLE_CLIENT_ID=<your_client_id>
  ```
- [ ] Set in Supabase secrets (via CLI or Dashboard):
  ```bash
  supabase secrets set GOOGLE_CLIENT_SECRET=<your_client_secret>
  supabase secrets set GOOGLE_CLIENT_ID=<your_client_id>
  ```

### GitHub Secrets (for CI/CD)
- [ ] Go to repo Settings → Secrets → Actions
- [ ] Add `VITE_GOOGLE_CLIENT_ID` (for build)
- [ ] Add `GOOGLE_CLIENT_SECRET` (for Edge Function deploy)

### Apple Developer (for iOS EventKit)
- [ ] Ensure Apple Developer account is active
- [ ] Add `NSCalendarsUsageDescription` to `ios/App/App/Info.plist`:
  ```xml
  <key>NSCalendarsUsageDescription</key>
  <string>CouplePlan needs access to your calendar to sync your couple's events.</string>
  ```
- [ ] Install Capacitor calendar plugin: `npm install @capacitor-community/calendar`
- [ ] `npx cap sync ios`

### Supabase (after running migration)
- [ ] Run migration `002_calendar_integration.sql` in Supabase dashboard or via CLI:
  ```bash
  supabase db push
  ```
- [ ] Verify tables `calendar_connections`, `calendar_events_cache`, `calendar_sync_log` exist
- [ ] Enable `pgcrypto` extension in Supabase if not already enabled:
  - Dashboard → Database → Extensions → enable pgcrypto

---

*This technical plan is a living document. Update it as implementation progresses.*
