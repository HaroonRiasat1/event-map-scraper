/**
 * Aggregation layer.
 *
 * Fans out to every configured source in parallel, normalises the responses and
 * merges them into one ranked list. A failing source degrades the result rather
 * than failing the search: the caller receives whatever succeeded plus a list of
 * source statuses it can surface in the UI.
 */

import { fetchVenues } from '../api/overpass.js';
import { fetchEvents, isTicketmasterEnabled } from '../api/ticketmaster.js';
import { isAbortError } from '../api/client.js';
import { MAX_RESULTS } from '../constants/config.js';
import { createLogger } from '../utils/logger.js';
import { isPast } from '../utils/date.js';
import { looseIncludes } from '../utils/string.js';
import { osmElementToEvent, ticketmasterEventToEvent } from './normalizers.js';

const log = createLogger('service:events');

/**
 * @typedef {object} SourceStatus
 * @property {string} id
 * @property {string} label
 * @property {'ok'|'error'|'skipped'} state
 * @property {number} count
 * @property {string} [message]
 */

/**
 * @typedef {object} SearchResult
 * @property {import('../types').EventItem[]} events
 * @property {SourceStatus[]} sources
 */

/**
 * Describes one pluggable source: how to fetch it, how to normalise it, and
 * whether it is available in this deployment.
 */
const SOURCES = [
  {
    id: 'osm',
    label: 'OpenStreetMap',
    isEnabled: () => true,
    fetch: (center, radius, signal) => fetchVenues(center, radius, { signal }),
    normalize: (items, center) =>
      items.map((item) => osmElementToEvent(item, center)).filter(Boolean),
  },
  {
    id: 'ticketmaster',
    label: 'Ticketmaster',
    isEnabled: isTicketmasterEnabled,
    fetch: (center, radius, signal) => fetchEvents(center, radius, { signal }),
    normalize: (items, center) =>
      items.map((item) => ticketmasterEventToEvent(item, center)).filter(Boolean),
  },
];

/**
 * Two sources can describe the same venue. Prefer the dated Ticketmaster entry
 * when names collide within ~120 m, since it carries more information.
 *
 * @param {import('../types').EventItem[]} events
 * @returns {import('../types').EventItem[]}
 */
function dedupe(events) {
  /** @type {Map<string, import('../types').EventItem>} */
  const byKey = new Map();

  for (const event of events) {
    // Round coordinates to ~110 m so near-identical points share a key.
    const key = [
      event.name.toLowerCase().trim(),
      event.coordinates[0].toFixed(3),
      event.coordinates[1].toFixed(3),
    ].join('|');

    const existing = byKey.get(key);
    if (!existing || (!existing.startsAt && event.startsAt)) byKey.set(key, event);
  }

  return [...byKey.values()];
}

/**
 * Dated events first (soonest first), then venues by distance. This puts
 * "something is actually happening here" above "this place exists".
 */
function rank(a, b) {
  if (Boolean(a.startsAt) !== Boolean(b.startsAt)) return a.startsAt ? -1 : 1;
  if (a.startsAt && b.startsAt) return new Date(a.startsAt) - new Date(b.startsAt);
  return a.distance - b.distance;
}

/**
 * Run a search across every enabled source.
 *
 * @param {[number, number]} center `[lat, lon]`
 * @param {number} radiusM
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<SearchResult>}
 */
export async function searchEvents(center, radiusM, { signal } = {}) {
  const active = SOURCES.filter((source) => source.isEnabled());

  const settled = await Promise.allSettled(
    active.map(async (source) => {
      const raw = await source.fetch(center, radiusM, signal);
      return { source, events: source.normalize(raw, center) };
    }),
  );

  // A cancelled search must not render half a result set.
  if (signal?.aborted) throw new DOMException('Search superseded', 'AbortError');

  /** @type {import('../types').EventItem[]} */
  const collected = [];
  /** @type {SourceStatus[]} */
  const statuses = [];

  settled.forEach((outcome, index) => {
    const source = active[index];
    if (outcome.status === 'fulfilled') {
      collected.push(...outcome.value.events);
      statuses.push({
        id: source.id,
        label: source.label,
        state: 'ok',
        count: outcome.value.events.length,
      });
    } else {
      if (isAbortError(outcome.reason)) throw outcome.reason;
      log.warn(`${source.id} failed`, outcome.reason);
      statuses.push({
        id: source.id,
        label: source.label,
        state: 'error',
        count: 0,
        message: outcome.reason?.message ?? 'Unknown error',
      });
    }
  });

  for (const source of SOURCES) {
    if (!source.isEnabled()) {
      statuses.push({
        id: source.id,
        label: source.label,
        state: 'skipped',
        count: 0,
        message: 'No API key configured',
      });
    }
  }

  const events = dedupe(collected)
    // Past one-off events are clutter; undated venues always stay.
    .filter((event) => !(event.source === 'ticketmaster' && isPast(event.startsAt)))
    .sort(rank)
    .slice(0, MAX_RESULTS);

  log.info(`${events.length} results from ${statuses.filter((s) => s.state === 'ok').length} sources`);
  return { events, sources: statuses };
}

/**
 * Client-side filtering, applied to an already-fetched result set so that
 * changing a filter never triggers a network round-trip.
 *
 * @param {import('../types').EventItem[]} events
 * @param {{ categories?: string[], query?: string, maxDistance?: number }} filters
 * @returns {import('../types').EventItem[]}
 */
export function filterEvents(events, { categories = [], query = '', maxDistance } = {}) {
  const term = query.trim();

  return events.filter((event) => {
    if (categories.length && !categories.includes(event.category)) return false;
    if (Number.isFinite(maxDistance) && event.distance > maxDistance) return false;
    if (
      term &&
      !looseIncludes(event.name, term) &&
      !looseIncludes(event.subtitle, term) &&
      !looseIncludes(event.address ?? '', term)
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Count results per category, for the filter chips' badges.
 *
 * @param {import('../types').EventItem[]} events
 * @returns {Record<string, number>}
 */
export function countByCategory(events) {
  return events.reduce((acc, event) => {
    acc[event.category] = (acc[event.category] ?? 0) + 1;
    return acc;
  }, {});
}
