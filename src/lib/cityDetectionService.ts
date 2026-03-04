/**
 * City Detection Service
 * Smart city resolution with localStorage cache + GPS background verification.
 *
 * Strategy:
 * 1. Read cached city from localStorage — return instantly for UI.
 * 2. If cache is fresh (<30 min), skip GPS.
 * 3. Otherwise run GPS + Nominatim in background.
 * 4. If city changed → update localStorage AND Supabase profiles.city.
 */

import { getUserCity } from './locationService';
import { supabase } from './supabase';

export const CITY_CACHE_KEY = 'userCity';
export const CITY_CACHE_TIMESTAMP_KEY = 'userCityTimestamp';

/** Re-verify GPS at most every 30 minutes */
export const CITY_CHECK_INTERVAL_MS = 1000 * 60 * 30;

export interface CityDetectionResult {
  city: string;
  changed: boolean;
}

/** Persist the user's city to their Supabase profile (fire-and-forget) */
export async function updateCityInProfile(city: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from('profiles')
    .update({ city, city_updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.warn('cityDetectionService: failed to update profile city', error.message);
  }
}

/**
 * Returns the user's current city, using localStorage as an instant cache.
 *
 * - If the cache is fresh (< CITY_CHECK_INTERVAL_MS) → return it immediately.
 * - Otherwise request GPS, compare, update if different.
 * - If GPS is unavailable → fall back to cache.
 */
export async function detectAndUpdateCity(): Promise<CityDetectionResult> {
  const cachedCity = localStorage.getItem(CITY_CACHE_KEY);
  const lastCheckRaw = localStorage.getItem(CITY_CACHE_TIMESTAMP_KEY);
  const now = Date.now();

  // ── Fast path: cache is fresh ────────────────────────────────────────────
  if (
    cachedCity &&
    lastCheckRaw &&
    now - parseInt(lastCheckRaw, 10) < CITY_CHECK_INTERVAL_MS
  ) {
    return { city: cachedCity, changed: false };
  }

  // ── GPS path ─────────────────────────────────────────────────────────────
  const currentCity = await getUserCity();

  if (!currentCity) {
    // GPS unavailable — use cache if we have it
    return { city: cachedCity ?? '', changed: false };
  }

  const changed = cachedCity !== currentCity;

  if (changed || !cachedCity) {
    localStorage.setItem(CITY_CACHE_KEY, currentCity);
    localStorage.setItem(CITY_CACHE_TIMESTAMP_KEY, now.toString());

    // Persist to Supabase in background — don't block the UI
    updateCityInProfile(currentCity).catch(console.error);
  } else {
    // City unchanged — just refresh the timestamp
    localStorage.setItem(CITY_CACHE_TIMESTAMP_KEY, now.toString());
  }

  return { city: currentCity, changed };
}

/** Read the currently cached city without triggering GPS. Null if unset. */
export function getCachedCity(): string | null {
  return localStorage.getItem(CITY_CACHE_KEY);
}

/** Manually set city (e.g. user typed it in their profile) */
export async function setManualCity(city: string): Promise<void> {
  localStorage.setItem(CITY_CACHE_KEY, city);
  localStorage.setItem(CITY_CACHE_TIMESTAMP_KEY, Date.now().toString());
  await updateCityInProfile(city);
}
