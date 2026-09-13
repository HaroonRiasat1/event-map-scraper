import { useCallback, useState } from 'react';
import { reverseGeocode } from '../api/nominatim.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('hook:geolocation');

/** Browser error codes are numeric; translate them into something readable. */
const GEO_ERRORS = {
  1: 'Location permission denied. Search for a city instead.',
  2: 'Your position is unavailable right now.',
  3: 'Timed out while locating you.',
};

/**
 * Resolve the device's position into a {@link import('../api/nominatim.js').Place}.
 *
 * @returns {{
 *   locate: () => Promise<import('../api/nominatim.js').Place | null>,
 *   isLocating: boolean,
 *   error: string,
 *   isSupported: boolean,
 * }}
 */
export function useGeolocation() {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');

  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const locate = useCallback(async () => {
    if (!isSupported) {
      setError('This browser cannot share your location.');
      return null;
    }

    setIsLocating(true);
    setError('');

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // City-level accuracy is all we need.
          timeout: 12_000,
          maximumAge: 5 * 60 * 1000,
        });
      });

      const coordinates = [position.coords.latitude, position.coords.longitude];
      const place = await reverseGeocode(coordinates);

      // Reverse geocoding can come back empty over water or in sparse areas;
      // the raw coordinates are still perfectly usable.
      return (
        place ?? {
          id: `coords/${coordinates.join(',')}`,
          name: 'My location',
          address: coordinates.map((n) => n.toFixed(4)).join(', '),
          country: '',
          countryCode: '',
          type: 'point',
          coordinates,
          bounds: null,
          importance: 1,
        }
      );
    } catch (err) {
      log.warn('locate failed', err);
      setError(GEO_ERRORS[err?.code] ?? 'Could not determine your location.');
      return null;
    } finally {
      setIsLocating(false);
    }
  }, [isSupported]);

  return { locate, isLocating, error, isSupported };
}
