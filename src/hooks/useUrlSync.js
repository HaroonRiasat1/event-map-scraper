import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_RADIUS_M } from '../constants/config.js';
import { isValidCoordinate } from '../utils/geo.js';

/**
 * Keep the current search in the address bar so a result set can be shared or
 * bookmarked: `?q=Turku&lat=60.45&lon=22.27&r=5000`.
 *
 * @returns {{
 *   initial: { place: import('../api/nominatim.js').Place | null, radius: number },
 *   sync: (place: import('../api/nominatim.js').Place | null, radius: number) => void,
 * }}
 */
export function useUrlSync() {
  // Read once, via a lazy initialiser — later renders are driven by state.
  const [initial] = useState(readFromUrl);

  const sync = useCallback((place, radius) => {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    if (place) {
      params.set('q', place.name);
      params.set('lat', place.coordinates[0].toFixed(5));
      params.set('lon', place.coordinates[1].toFixed(5));
      params.set('r', String(radius));
    } else {
      ['q', 'lat', 'lon', 'r'].forEach((key) => params.delete(key));
    }

    // `replaceState` keeps the back button meaning "leave the app" rather than
    // stepping through every radius tweak.
    window.history.replaceState(null, '', url);
  }, []);

  return { initial, sync };
}

/** @returns {{ place: import('../api/nominatim.js').Place | null, radius: number }} */
function readFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const radius = Number(params.get('r')) || DEFAULT_RADIUS_M;
  const name = params.get('q') ?? '';

  // `Number(null)` is 0, so a missing parameter would otherwise resolve to a
  // perfectly valid coordinate off the coast of Africa.
  const lat = params.get('lat');
  const lon = params.get('lon');
  if (lat === null || lon === null) return { place: null, radius };

  const coordinates = [Number(lat), Number(lon)];
  if (!isValidCoordinate(coordinates)) return { place: null, radius };

  return {
    place: {
      id: `url/${coordinates.join(',')}`,
      name: name || 'Shared location',
      address: name,
      country: '',
      countryCode: '',
      type: 'place',
      coordinates,
      bounds: null,
      importance: 1,
    },
    radius,
  };
}

/** Restore the document title to match the current search. */
export function useDocumentTitle(placeName) {
  useEffect(() => {
    document.title = placeName
      ? `${placeName} · Event Map Scraper`
      : 'Event Map Scraper — find events near you';
  }, [placeName]);
}
