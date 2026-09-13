/**
 * Nominatim (OpenStreetMap) geocoding.
 *
 * Turns a free-text query such as "turku" into coordinates plus a bounding box.
 * Requires no API key. Usage policy: at most one request per second and a
 * meaningful identifier — both are handled here so callers cannot forget.
 *
 * @see https://operations.osmfoundation.org/policies/nominatim/
 */

import { API, APP_NAME, APP_VERSION, CACHE_TTL_MS, SEARCH } from '../constants/config.js';
import { withCache } from '../utils/cache.js';
import { buildUrl } from '../utils/url.js';
import { joinNonEmpty } from '../utils/string.js';
import { nominatimBboxToLeaflet } from '../utils/geo.js';
import { rateLimit, request } from './client.js';

/**
 * @typedef {object} Place
 * @property {string} id        Stable id, e.g. `relation/399906`
 * @property {string} name      Short label, e.g. `Turku`
 * @property {string} address   Full label from Nominatim
 * @property {string} country
 * @property {string} countryCode
 * @property {string} type      e.g. `city`, `town`, `suburb`
 * @property {[number, number]} coordinates `[lat, lon]`
 * @property {[[number, number], [number, number]] | null} bounds
 * @property {number} importance Nominatim relevance score, 0..1
 */

const identity = `${APP_NAME}/${APP_VERSION}`;

/** Raw fetch, wrapped below so every caller shares one 1-req/sec queue. */
const fetchNominatim = rateLimit(
  (url, signal) =>
    request(url, {
      signal,
      source: 'nominatim',
      // A browser cannot set User-Agent; Nominatim also accepts this hint.
      headers: { 'Accept-Language': navigator.language || 'en' },
    }),
  API.nominatim.minIntervalMs,
);

/**
 * Map one Nominatim record onto our {@link Place} shape.
 *
 * @param {any} raw
 * @returns {Place}
 */
function toPlace(raw) {
  const address = raw.address ?? {};
  const name =
    raw.name ||
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    String(raw.display_name ?? '').split(',')[0];

  return {
    id: `${raw.osm_type ?? 'place'}/${raw.osm_id ?? raw.place_id}`,
    name,
    address: raw.display_name ?? name,
    country: address.country ?? '',
    countryCode: (address.country_code ?? '').toUpperCase(),
    type: raw.addresstype || raw.type || 'place',
    coordinates: [Number(raw.lat), Number(raw.lon)],
    bounds: nominatimBboxToLeaflet(raw.boundingbox),
    importance: Number(raw.importance ?? 0),
  };
}

/**
 * Search for places matching a free-text query.
 *
 * @param {string} query
 * @param {{ limit?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<Place[]>} ordered by relevance, best first
 */
export async function searchPlaces(query, { limit = SEARCH.maxSuggestions, signal } = {}) {
  const trimmed = query.trim();
  if (trimmed.length < SEARCH.minQueryLength) return [];

  const url = buildUrl(`${API.nominatim.baseUrl}/search`, {
    q: trimmed,
    format: 'jsonv2',
    addressdetails: 1,
    limit,
    'accept-language': navigator.language || 'en',
    dedupe: 1,
  });

  return withCache('geocode', `${trimmed.toLowerCase()}:${limit}`, CACHE_TTL_MS.geocode, async () => {
    const data = await fetchNominatim(url, signal);
    return Array.isArray(data) ? data.map(toPlace) : [];
  });
}

/**
 * Resolve a query to its single best match — what the search bar does on
 * submit, when the user has not picked a suggestion.
 *
 * @param {string} query
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Place | null>}
 */
export async function geocode(query, options = {}) {
  const [best] = await searchPlaces(query, { ...options, limit: 1 });
  return best ?? null;
}

/**
 * Turn coordinates into a place — used by the "near me" button.
 *
 * @param {[number, number]} coordinates `[lat, lon]`
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Place | null>}
 */
export async function reverseGeocode([lat, lon], { signal } = {}) {
  const url = buildUrl(`${API.nominatim.baseUrl}/reverse`, {
    lat,
    lon,
    format: 'jsonv2',
    addressdetails: 1,
    zoom: 12, // City-level detail; street-level is needless noise here.
  });

  return withCache(
    'geocode',
    `reverse:${lat.toFixed(3)},${lon.toFixed(3)}`,
    CACHE_TTL_MS.geocode,
    async () => {
      const data = await fetchNominatim(url, signal);
      return data && !data.error ? toPlace(data) : null;
    },
  );
}

/** One-line label for a place, e.g. "Turku, Finland". */
export const placeLabel = (place) =>
  place ? joinNonEmpty([place.name, place.country]) : '';

export { identity as nominatimIdentity };
