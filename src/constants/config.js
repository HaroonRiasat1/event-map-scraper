/**
 * Central runtime configuration.
 *
 * Everything tunable lives here so that no component or service hard-codes a
 * magic number. Values sourced from `import.meta.env` are read once at module
 * load so the rest of the app never touches `import.meta` directly.
 */

/** Identifies this app to the OSM services, as their usage policy requires. */
export const APP_NAME = 'EventMapScraper';
export const APP_VERSION = '1.0.0';
export const APP_CONTACT = 'https://github.com/HaroonRiasat1/event-map-scraper';

export const API = {
  nominatim: {
    baseUrl: 'https://nominatim.openstreetmap.org',
    /** Nominatim's usage policy allows at most 1 request per second. */
    minIntervalMs: 1100,
  },
  overpass: {
    /**
     * Overpass mirrors, tried in order.
     *
     * A mirror qualifies only if it meets BOTH conditions:
     *
     * 1. It sends `Access-Control-Allow-Origin` — without it the browser
     *    discards the response and the fallback is worthless.
     * 2. It carries the **global** planet database.
     *
     * The second condition is the easy one to miss and the dangerous one to get
     * wrong. `overpass.osm.ch`, for example, answers fast and sends correct CORS
     * headers, but only hosts a Switzerland extract: it returns an empty
     * `elements` array for anywhere else on earth. That reads as a successful
     * search with zero results, so the app silently shows "nothing found" for
     * every city outside Switzerland instead of reporting an error.
     *
     * Verify coverage before adding a mirror here: query a known-busy area in
     * two different countries and confirm both return hits.
     */
    endpoints: ['https://overpass-api.de/api/interpreter'],
    /** Server-side query budget, in seconds. Must stay below `timeoutMs`. */
    queryTimeoutSec: 18,
    /** Per-attempt client budget. */
    timeoutMs: 20_000,
    /**
     * With a single mirror there is nowhere to fail over to, so transient
     * rate-limit responses (429, and the 504 the main instance returns when its
     * queue is full) are retried with back-off instead.
     */
    retries: 2,
  },
  ticketmaster: {
    baseUrl: 'https://app.ticketmaster.com/discovery/v2',
    apiKey: import.meta.env.VITE_TICKETMASTER_API_KEY ?? '',
    pageSize: 100,
  },
  openMeteo: {
    baseUrl: 'https://api.open-meteo.com/v1/forecast',
  },
};

/** Default options applied to every outbound HTTP request. */
export const HTTP = {
  timeoutMs: 30_000,
  retries: 2,
  retryBaseDelayMs: 600,
};

/** Time-to-live for cached responses, keyed by cache namespace. */
export const CACHE_TTL_MS = {
  geocode: 24 * 60 * 60 * 1000, // Place coordinates effectively never move.
  venues: 60 * 60 * 1000,
  events: 15 * 60 * 1000,
  weather: 10 * 60 * 1000,
};

export const SEARCH = {
  /** Delay before a keystroke turns into a geocoding request. */
  debounceMs: 350,
  minQueryLength: 2,
  maxSuggestions: 6,
  maxRecentSearches: 8,
};

export const MAP = {
  /** Roughly the centre of Europe — a neutral starting view. */
  defaultCenter: [54.526, 15.255],
  defaultZoom: 4,
  /** Zoom applied once a city has been resolved. */
  locationZoom: 13,
  minZoom: 2,
  maxZoom: 19,
  /**
   * Standard OpenStreetMap tiles: keyless and permanently free, unlike the
   * hosted dark themes. The dark look comes from a CSS filter on the tile pane
   * (see `styles/global.css`) rather than from a commercial tile provider.
   */
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

/** Search radii offered in the UI, in metres. */
export const RADIUS_OPTIONS_M = [1000, 2500, 5000, 10_000, 25_000];
export const DEFAULT_RADIUS_M = 5000;

/** Overpass can return thousands of nodes; cap what we render. */
export const MAX_RESULTS = 400;

export const STORAGE_KEYS = {
  recentSearches: 'ems:recent-searches',
  filters: 'ems:filters',
};
