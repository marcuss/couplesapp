-- ============================================================================
-- MIGRATION 002: Calendar Integration
-- ============================================================================
-- Adds support for Google Calendar and Apple Calendar integration
-- New tables:
--   - calendar_connections: OAuth tokens and provider connections per user
--   - calendar_events_cache: Cached external calendar events for display
--   - calendar_sync_log: Audit log of all sync operations
-- ============================================================================

-- Enable pgcrypto for token encryption (safe to run even if already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- CALENDAR_CONNECTIONS TABLE
-- One row per user per provider. Stores encrypted OAuth tokens.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider                text        NOT NULL CHECK (provider IN ('google', 'apple')),
  provider_account_email  text,       -- Display only (e.g. user@gmail.com)
  access_token            text,       -- Encrypted with pgp_sym_encrypt
  refresh_token           text,       -- Encrypted with pgp_sym_encrypt
  token_expires_at        timestamptz,
  is_active               boolean     NOT NULL DEFAULT true,
  selected_calendars      jsonb       NOT NULL DEFAULT '[]'::jsonb,
  -- Array of { id, name, color, enabled } objects
  webhook_channel_id      text,       -- Google push notification channel id
  webhook_resource_id     text,       -- Google push notification resource id
  webhook_expires_at      timestamptz,
  last_synced_at          timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

COMMENT ON TABLE public.calendar_connections IS
  'Stores OAuth connections to external calendar providers (Google, Apple) per user.';
COMMENT ON COLUMN public.calendar_connections.access_token IS
  'Google OAuth access token, encrypted with pgp_sym_encrypt.';
COMMENT ON COLUMN public.calendar_connections.refresh_token IS
  'Google OAuth refresh token, encrypted with pgp_sym_encrypt. Used to renew access tokens.';
COMMENT ON COLUMN public.calendar_connections.selected_calendars IS
  'JSON array of calendar objects the user has selected to sync. Format: [{id, name, color, enabled}]';

-- ============================================================================
-- CALENDAR_EVENTS_CACHE TABLE
-- Cache of external events fetched from Google/Apple for display in CouplePlan.
-- This table is managed by Edge Functions; frontend reads it but does not write.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_events_cache (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id       uuid        NOT NULL REFERENCES public.calendar_connections(id) ON DELETE CASCADE,
  user_id             uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  external_id         text        NOT NULL,   -- Google event ID or Apple UID
  calendar_id         text,                   -- Which calendar within the provider
  title               text        NOT NULL,
  description         text,
  start_time          timestamptz NOT NULL,
  end_time            timestamptz,
  is_all_day          boolean     NOT NULL DEFAULT false,
  location            text,
  color               text,                   -- Color from external provider
  provider            text        NOT NULL CHECK (provider IN ('google', 'apple')),
  raw_data            jsonb,                  -- Full event payload for debugging/reference
  couple_plan_event_id uuid       REFERENCES public.events(id) ON DELETE SET NULL,
  -- ^ If this external event was originally CREATED from CouplePlan, links back to source
  etag                text,                   -- For change detection (Google etag field)
  synced_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE(connection_id, external_id)
);

COMMENT ON TABLE public.calendar_events_cache IS
  'Cache of external calendar events from Google/Apple. Managed by Edge Functions.';
COMMENT ON COLUMN public.calendar_events_cache.couple_plan_event_id IS
  'If this external event was exported FROM CouplePlan, this links back to the original event.';
COMMENT ON COLUMN public.calendar_events_cache.etag IS
  'Google Calendar etag for efficient change detection. Only refetch when etag changes.';

-- ============================================================================
-- CALENDAR_SYNC_LOG TABLE
-- Immutable audit log of all sync operations for debugging and analytics.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_sync_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   uuid        REFERENCES public.calendar_connections(id) ON DELETE SET NULL,
  user_id         uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sync_type       text        NOT NULL CHECK (sync_type IN ('push', 'pull', 'webhook', 'manual')),
  direction       text        NOT NULL CHECK (direction IN ('to_external', 'from_external', 'both')),
  status          text        NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  events_pushed   integer     NOT NULL DEFAULT 0,
  events_pulled   integer     NOT NULL DEFAULT 0,
  conflicts_found integer     NOT NULL DEFAULT 0,
  error_message   text,
  metadata        jsonb,      -- Additional context (which calendars, etc.)
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz
);

COMMENT ON TABLE public.calendar_sync_log IS
  'Immutable audit log of calendar sync operations. Used for debugging and analytics.';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- calendar_connections: common lookups
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id
  ON public.calendar_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_connections_provider
  ON public.calendar_connections(user_id, provider)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_calendar_connections_webhook_expires
  ON public.calendar_connections(webhook_expires_at)
  WHERE webhook_channel_id IS NOT NULL;

-- calendar_events_cache: time-based queries for calendar view
CREATE INDEX IF NOT EXISTS idx_calendar_events_cache_user_time
  ON public.calendar_events_cache(user_id, start_time);

CREATE INDEX IF NOT EXISTS idx_calendar_events_cache_connection
  ON public.calendar_events_cache(connection_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_cache_couple_plan
  ON public.calendar_events_cache(couple_plan_event_id)
  WHERE couple_plan_event_id IS NOT NULL;

-- calendar_sync_log: user-based lookup
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_user_id
  ON public.calendar_sync_log(user_id, started_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_log ENABLE ROW LEVEL SECURITY;

-- ----- calendar_connections policies -----

CREATE POLICY "Users can view own connections"
  ON public.calendar_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
  ON public.calendar_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON public.calendar_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON public.calendar_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- ----- calendar_events_cache policies -----
-- Users can see their own cached events AND their partner's cached events
-- (so both people in the couple see each other's synced calendars)

CREATE POLICY "Users can view own cached events"
  ON public.calendar_events_cache
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR
    auth.uid() IN (
      SELECT partner_id FROM public.profiles WHERE id = calendar_events_cache.user_id AND partner_id IS NOT NULL
    )
  );

-- Direct user write is blocked; Edge Functions use service_role
CREATE POLICY "Service role can manage event cache"
  ON public.calendar_events_cache
  FOR ALL
  USING (auth.role() = 'service_role');

-- ----- calendar_sync_log policies -----

CREATE POLICY "Users can view own sync logs"
  ON public.calendar_sync_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Sync logs are written by Edge Functions (service_role) only
CREATE POLICY "Service role can insert sync logs"
  ON public.calendar_sync_log
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGER (for calendar_connections)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_calendar_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_calendar_connections_updated_at
  BEFORE UPDATE ON public.calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_calendar_connections_updated_at();

-- ============================================================================
-- END OF MIGRATION 002
-- ============================================================================
