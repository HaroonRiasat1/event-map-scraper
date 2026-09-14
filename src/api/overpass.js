/**
 * Overpass API — the map-scraping source.
 *
 * Overpass runs queries against live OpenStreetMap data. We ask it for every
 * node/way/relation near a point that is tagged as somewhere events happen —
 * theatres, clubs, arenas, museums, community centres — and normalise the
 * result. No API key is required.
 *
 * @see https://wiki.openstreetmap.org/wiki/Overpass_API
 */

import { API, CACHE_TTL_MS, MAX_RESULTS } from '../constants/config.js';
import { CATEGORY_BY_MATCHER } from '../constants/categories.js';
import { withCache } from '../utils/cache.js';
import { createLogger } from '../utils/logger.js';
import { ApiError, isAbortError, request } from './client.js';

const log = createLogger('api:overpass');

/**
 * The tags to scrape, derived from the category taxonomy.
 *
 * Deriving rather than duplicating guarantees the two can never drift: every
 * tag we query has a category to land in, and every category has tags that are
 * actually queried.
 *
 * @type {Array<[string, string]>} `[key, value]` pairs
 */
const VENUE_SELECTORS = Object.keys(CATEGORY_BY_MATCHER).map((matcher) => {
  const separator = matcher.indexOf('=');
  return [matcher.slice(0, separator), matcher.slice(separator + 1)];
});

/**
 * Build Overpass QL for a radius search.
 *
 * Each tag gets its own exact-match clause. The obvious alternative — one
 * `["amenity"~"^(theatre|cinema|…)$"]` clause per key — reads better but is
 * dramatically slower: a regex cannot use the tag-value index, so Overpass
 * falls back to scanning, and a city-sized query can take minutes or time out
 * entirely. Exact matches return in well under a second.
 *
 * For the same reason there are no key-only clauses (`["event"]`): matching a
 * key with any value forces the same full scan.
 *
 * @param {[number, number]} center `[lat, lon]`
 * @param {number} radiusM
 * @returns {string} Overpass QL
 */
export function buildVenueQuery([lat, lon], radiusM) {
  const around = `(around:${Math.round(radiusM)},${lat.toFixed(6)},${lon.toFixed(6)})`;

  const clauses = VENUE_SELECTORS.map(
    ([key, value]) => `  nwr["${key}"="${value}"]${around};`,
  );

  return [
    `[out:json][timeout:${API.overpass.queryTimeoutSec}];`,
    '(',
    ...clauses,
    ');',
    // `center` gives ways and relations a single point to drop a marker on.
    `out center tags ${MAX_RESULTS};`,
  ].join('\n');
}

/**
 * @typedef {object} OverpassElement
 * @property {'node'|'way'|'relation'} type
 * @property {number} id
 * @property {number} [lat]
 * @property {number} [lon]
 * @property {{ lat: number, lon: number }} [center]
 * @property {Record<string, string>} [tags]
 */

/**
 * Run a query against the first mirror that answers.
 *
 * Mirrors queue requests per IP and answer 429 (or 504, once the queue is full)
 * under load. Those are transient, so `request()` retries them with back-off
 * before this loop moves on to the next host.
 *
 * @param {string} query Overpass QL
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<OverpassElement[]>}
 */
async function runQuery(query, { signal } = {}) {
  let lastError;

  for (const endpoint of API.overpass.endpoints) {
    try {
      const data = await request(endpoint, {
        method: 'POST',
        body: new URLSearchParams({ data: query }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal,
        source: 'overpass',
        timeoutMs: API.overpass.timeoutMs,
        retries: API.overpass.retries,
      });
      log.debug(`${endpoint} returned ${data?.elements?.length ?? 0} elements`);
      return Array.isArray(data?.elements) ? data.elements : [];
    } catch (error) {
      if (isAbortError(error)) throw error;
      log.warn(`mirror unavailable: ${endpoint}`, error.message);
      lastError = error;
    }
  }

  throw new ApiError(
    'OpenStreetMap is busy right now. It is a volunteer-run, rate-limited service — try again in a minute.',
    { source: 'overpass', cause: lastError, retryable: true },
  );
}

/**
 * Fetch event venues around a point.
 *
 * @param {[number, number]} center `[lat, lon]`
 * @param {number} radiusM
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<OverpassElement[]>}
 */
export async function fetchVenues(center, radiusM, options = {}) {
  const key = `${center[0].toFixed(3)},${center[1].toFixed(3)}:${radiusM}`;
  return withCache('venues', key, CACHE_TTL_MS.venues, () =>
    runQuery(buildVenueQuery(center, radiusM), options),
  );
}

/**
 * Elements come back as nodes (with `lat`/`lon`) or ways and relations (with
 * `center`). Normalise both to a coordinate pair.
 *
 * @param {OverpassElement} element
 * @returns {[number, number] | null}
 */
export function elementCoordinates(element) {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
}

/** Link back to the OSM object, so users can verify or fix the data. */
export const osmUrl = (element) =>
  `https://www.openstreetmap.org/${element.type}/${element.id}`;
