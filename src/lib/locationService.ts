/**
 * Location Service
 * Obtains the user's city via browser Geolocation + Nominatim reverse geocoding.
 * Falls back gracefully when permissions are denied or unavailable.
 */

/** Nominatim reverse-geocode response shape (partial) */
interface NominatimResponse {
  address?: {
    city?: string;
    town?: string;
    municipality?: string;
    county?: string;
    state?: string;
  };
}

/**
 * Reverse-geocode a lat/lng to a city name using Nominatim (OpenStreetMap).
 * Free, no API key required.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'LoveCompass/1.0' },
    });

    if (!response.ok) return null;

    const data: NominatimResponse = await response.json();

    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.municipality ||
      data.address?.county ||
      data.address?.state;

    return city ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the user's city using the browser Geolocation API + Nominatim.
 * Returns null if permission is denied or an error occurs.
 */
export async function getUserCityWeb(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const city = await reverseGeocode(
          pos.coords.latitude,
          pos.coords.longitude
        );
        resolve(city);
      },
      () => resolve(null),
      { timeout: 10000 }
    );
  });
}

/**
 * Attempt to obtain the user's city, first via Capacitor (native),
 * then via browser geolocation as a fallback.
 *
 * In a pure web build the Capacitor import will be absent, so we
 * dynamically try it and fall back.
 */
export async function getUserCity(): Promise<string | null> {
  try {
    // Dynamic import so web-only bundles don't break
    const { Geolocation } = await import('@capacitor/geolocation');
    const permission = await Geolocation.requestPermissions();
    if (permission.location !== 'granted') return getUserCityWeb();

    const position = await Geolocation.getCurrentPosition({
      timeout: 10000,
      enableHighAccuracy: false,
    });

    return reverseGeocode(
      position.coords.latitude,
      position.coords.longitude
    );
  } catch {
    // Capacitor not available — use browser API
    return getUserCityWeb();
  }
}
