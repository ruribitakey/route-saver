import { LocationPoint } from '@/types/route';

/**
 * Get current browser GPS location coordinates (lat, lng)
 */
export function getCurrentCoordinates(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('位置情報 (Geolocation) がお使いのブラウザでサポートされていません。'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Reverse geocode lat/lng to a human-readable location name
 */
export async function reverseGeocodeLocation(lat: number, lng: number): Promise<LocationPoint> {
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });

      if (response.results && response.results[0]) {
        const result = response.results[0];
        const address = result.formatted_address || '現在地';
        const cleanAddress = address.replace(/^日本、?/, '').split('、')[0];

        return {
          name: `現在地 (${cleanAddress})`,
          lat,
          lng,
          placeId: result.place_id,
        };
      }
    } catch (e) {
      console.warn('Google Maps reverse geocoding fallback', e);
    }
  }

  // Fallback
  return {
    name: `現在地 (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    lat,
    lng,
  };
}

/**
 * Helper to fetch current location point directly
 */
export async function fetchCurrentLocationPoint(): Promise<LocationPoint> {
  const coords = await getCurrentCoordinates();
  return await reverseGeocodeLocation(coords.lat, coords.lng);
}
