/**
 * cityDetectionService tests
 * Verifies: cache hits, GPS change detection, no-change path, GPS unavailable
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Capacitor (not installed in web-only test env) ──────────────────────
vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    requestPermissions: vi.fn().mockResolvedValue({ location: 'granted' }),
    getCurrentPosition: vi.fn().mockResolvedValue({
      coords: { latitude: 6.25, longitude: -75.56 },
    }),
  },
}));

// ── Mock dependencies ────────────────────────────────────────────────────────
vi.mock('../locationService', () => ({
  getUserCity: vi.fn(),
}));

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

import { getUserCity } from '../locationService';
import {
  detectAndUpdateCity,
  getCachedCity,
  setManualCity,
  CITY_CACHE_KEY,
  CITY_CACHE_TIMESTAMP_KEY,
  CITY_CHECK_INTERVAL_MS,
} from '../cityDetectionService';

// ── localStorage mock ─────────────────────────────────────────────────────────
// Note: setup.ts replaces window.localStorage with a plain vi.fn() mock,
// so we cannot spy on Storage.prototype — we must configure the mock directly.
const store: Record<string, string> = {};

beforeEach(() => {
  vi.clearAllMocks();

  // Clean store state
  Object.keys(store).forEach((k) => delete store[k]);

  // Re-configure the already-replaced window.localStorage mock fns to use our store
  (window.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation(
    (key: string) => store[key] ?? null
  );
  (window.localStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation(
    (key: string, value: string) => { store[key] = String(value); }
  );
  (window.localStorage.removeItem as ReturnType<typeof vi.fn>).mockImplementation(
    (key: string) => { delete store[key]; }
  );
});

// ─── Tests ────────────────────────────────────────────────────────────────

describe('detectAndUpdateCity', () => {
  it('returns cached city immediately when cache is fresh (< 30 min)', async () => {
    const recentTs = Date.now() - 1000 * 60 * 5; // 5 minutes ago
    store[CITY_CACHE_KEY] = 'Medellín';
    store[CITY_CACHE_TIMESTAMP_KEY] = recentTs.toString();

    const result = await detectAndUpdateCity();

    expect(result).toEqual({ city: 'Medellín', changed: false });
    expect(getUserCity).not.toHaveBeenCalled();
  });

  it('calls GPS when cache is stale (> 30 min)', async () => {
    const oldTs = Date.now() - CITY_CHECK_INTERVAL_MS - 1000;
    store[CITY_CACHE_KEY] = 'Medellín';
    store[CITY_CACHE_TIMESTAMP_KEY] = oldTs.toString();

    vi.mocked(getUserCity).mockResolvedValue('Medellín');

    const result = await detectAndUpdateCity();

    expect(getUserCity).toHaveBeenCalled();
    expect(result).toEqual({ city: 'Medellín', changed: false });
  });

  it('detects city change and updates localStorage', async () => {
    const oldTs = Date.now() - CITY_CHECK_INTERVAL_MS - 1000;
    store[CITY_CACHE_KEY] = 'Bogotá';
    store[CITY_CACHE_TIMESTAMP_KEY] = oldTs.toString();

    vi.mocked(getUserCity).mockResolvedValue('Cartagena');

    const result = await detectAndUpdateCity();

    expect(result).toEqual({ city: 'Cartagena', changed: true });
    expect(store[CITY_CACHE_KEY]).toBe('Cartagena');
  });

  it('does NOT mark changed when city is the same', async () => {
    const oldTs = Date.now() - CITY_CHECK_INTERVAL_MS - 1000;
    store[CITY_CACHE_KEY] = 'Cali';
    store[CITY_CACHE_TIMESTAMP_KEY] = oldTs.toString();

    vi.mocked(getUserCity).mockResolvedValue('Cali');

    const result = await detectAndUpdateCity();

    expect(result.changed).toBe(false);
    expect(result.city).toBe('Cali');
  });

  it('falls back to cached city when GPS unavailable', async () => {
    const oldTs = Date.now() - CITY_CHECK_INTERVAL_MS - 1000;
    store[CITY_CACHE_KEY] = 'Barranquilla';
    store[CITY_CACHE_TIMESTAMP_KEY] = oldTs.toString();

    vi.mocked(getUserCity).mockResolvedValue(null);

    const result = await detectAndUpdateCity();

    expect(result).toEqual({ city: 'Barranquilla', changed: false });
  });

  it('returns empty string when GPS unavailable and no cache', async () => {
    vi.mocked(getUserCity).mockResolvedValue(null);

    const result = await detectAndUpdateCity();

    expect(result).toEqual({ city: '', changed: false });
  });

  it('stores city in localStorage on first detection (no cache)', async () => {
    vi.mocked(getUserCity).mockResolvedValue('Pereira');

    const result = await detectAndUpdateCity();

    expect(result.city).toBe('Pereira');
    expect(store[CITY_CACHE_KEY]).toBe('Pereira');
  });
});

// ─── getCachedCity ────────────────────────────────────────────────────────

describe('getCachedCity', () => {
  it('returns null when nothing is cached', () => {
    expect(getCachedCity()).toBeNull();
  });

  it('returns the cached city', () => {
    store[CITY_CACHE_KEY] = 'Manizales';
    expect(getCachedCity()).toBe('Manizales');
  });
});

// ─── setManualCity ────────────────────────────────────────────────────────

describe('setManualCity', () => {
  it('updates localStorage with the manual city', async () => {
    await setManualCity('Bucaramanga');
    expect(store[CITY_CACHE_KEY]).toBe('Bucaramanga');
    expect(store[CITY_CACHE_TIMESTAMP_KEY]).toBeTruthy();
  });
});
