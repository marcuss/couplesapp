/**
 * Test stub for @capacitor/geolocation
 * Used in vitest via resolve.alias so the module resolves without being installed.
 */
import { vi } from 'vitest';

export const Geolocation = {
  requestPermissions: vi.fn().mockResolvedValue({ location: 'granted' }),
  getCurrentPosition: vi.fn().mockResolvedValue({
    coords: { latitude: 6.25, longitude: -75.56 },
  }),
};
