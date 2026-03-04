/**
 * locationService tests — mock geolocation + Nominatim fetch
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Capacitor so vite can resolve the module in tests
vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    requestPermissions: vi.fn().mockResolvedValue({ location: 'granted' }),
    getCurrentPosition: vi.fn().mockResolvedValue({
      coords: { latitude: 6.25, longitude: -75.56 },
    }),
  },
}));

import { reverseGeocode, getUserCityWeb } from '../locationService';

// ── Mock fetch ───────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── reverseGeocode ──────────────────────────────────────────────────────────

describe('reverseGeocode', () => {
  it('extracts city from Nominatim response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ address: { city: 'Medellín' } }),
    });

    const city = await reverseGeocode(6.2518, -75.5636);
    expect(city).toBe('Medellín');
  });

  it('falls back to town when city is absent', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ address: { town: 'El Poblado' } }),
    });

    const city = await reverseGeocode(6.2, -75.5);
    expect(city).toBe('El Poblado');
  });

  it('falls back to state as last resort', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ address: { state: 'Antioquia' } }),
    });

    const city = await reverseGeocode(6.2, -75.5);
    expect(city).toBe('Antioquia');
  });

  it('returns null when fetch fails (non-ok)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const city = await reverseGeocode(0, 0);
    expect(city).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'));
    const city = await reverseGeocode(0, 0);
    expect(city).toBeNull();
  });

  it('returns null when address is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });
    const city = await reverseGeocode(0, 0);
    expect(city).toBeNull();
  });
});

// ─── getUserCityWeb ──────────────────────────────────────────────────────────

describe('getUserCityWeb', () => {
  it('returns null when navigator.geolocation is absent', async () => {
    const originalGeo = (navigator as { geolocation?: unknown }).geolocation;
    Object.defineProperty(navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });

    const city = await getUserCityWeb();
    expect(city).toBeNull();

    Object.defineProperty(navigator, 'geolocation', {
      value: originalGeo,
      configurable: true,
    });
  });

  it('returns null when geolocation permission is denied', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((_s, error) => error({ code: 1 })),
      },
      configurable: true,
    });

    const city = await getUserCityWeb();
    expect(city).toBeNull();
  });

  it('returns city name on success', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((success) =>
          success({ coords: { latitude: 4.71, longitude: -74.07 } })
        ),
      },
      configurable: true,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ address: { city: 'Bogotá' } }),
    });

    const city = await getUserCityWeb();
    expect(city).toBe('Bogotá');
  });
});
