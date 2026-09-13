/**
 * Ticketmaster Discovery API — optional source of real, dated events.
 *
 * Unlike the other sources this one needs a free API key. When
 * `VITE_TICKETMASTER_API_KEY` is absent the module reports itself as disabled
 * and the aggregator simply skips it, so the app still works out of the box.
 *
 * @see https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */

import { API, CACHE_TTL_MS } from '../constants/config.js';
import { withCache } from '../utils/cache.js';
import { buildUrl } from '../utils/url.js';
import { addDays, toIsoSeconds } from '../utils/date.js';
import { request } from './client.js';

/** @returns {boolean} whether a key is configured. */
export const isTicketmasterEnabled = () => Boolean(API.ticketmaster.apiKey);

/**
 * Fetch events happening near a point within a date window.
 *
 * @param {[number, number]} center `[lat, lon]`
 * @param {number} radiusM
 * @param {{ daysAhead?: number, size?: number, signal?: AbortSignal }} [options]
 * @returns {Promise<any[]>} raw Discovery API events (empty when disabled)
 */
export async function fetchEvents([lat, lon], radiusM, options = {}) {
  if (!isTicketmasterEnabled()) return [];

  const { daysAhead = 90, size = API.ticketmaster.pageSize, signal } = options;
  // The API takes a radius with an explicit unit; kilometres keep it integral.
  const radiusKm = Math.max(1, Math.round(radiusM / 1000));

  const url = buildUrl(`${API.ticketmaster.baseUrl}/events.json`, {
    apikey: API.ticketmaster.apiKey,
    latlong: `${lat},${lon}`,
    radius: radiusKm,
    unit: 'km',
    startDateTime: toIsoSeconds(new Date()),
    endDateTime: toIsoSeconds(addDays(daysAhead)),
    size: Math.min(size, 200),
    sort: 'date,asc',
  });

  const key = `${lat.toFixed(3)},${lon.toFixed(3)}:${radiusKm}:${daysAhead}`;
  return withCache('events', key, CACHE_TTL_MS.events, async () => {
    const data = await request(url, { signal, source: 'ticketmaster' });
    return data?._embedded?.events ?? [];
  });
}
