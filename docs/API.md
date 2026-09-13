# Module reference

The public surface of each module. Everything not listed here is internal.

## `api/client.js`

| Export | Signature | Notes |
|---|---|---|
| `request` | `(url, options?) => Promise<any>` | The only place the app calls `fetch`. Options: `method`, `body`, `headers`, `signal`, `timeoutMs`, `retries`, `source` |
| `ApiError` | `class` | `message`, `status`, `source`, `cause`, `retryable` |
| `isAbortError` | `(error) => boolean` | Distinguishes "the user moved on" from "this failed" |
| `rateLimit` | `(fn, minIntervalMs) => fn` | Serialises calls through a promise queue |

Retries apply only to 408, 425, 429 and 5xx, with exponential back-off plus
jitter. A caller-initiated abort is rethrown immediately and never retried.

## `api/nominatim.js`

| Export | Signature |
|---|---|
| `searchPlaces` | `(query, { limit?, signal? }) => Promise<Place[]>` |
| `geocode` | `(query, { signal? }) => Promise<Place \| null>` |
| `reverseGeocode` | `([lat, lon], { signal? }) => Promise<Place \| null>` |
| `placeLabel` | `(place) => string` — `"Turku, Finland"` |

```ts
type Place = {
  id: string;            // "relation/399906"
  name: string;          // "Turku"
  address: string;       // full display name
  country: string;
  countryCode: string;   // "FI"
  type: string;          // "city"
  coordinates: [number, number];
  bounds: [[number, number], [number, number]] | null;
  importance: number;    // 0..1
};
```

## `api/overpass.js`

| Export | Signature |
|---|---|
| `fetchVenues` | `([lat, lon], radiusM, { signal? }) => Promise<OverpassElement[]>` |
| `buildVenueQuery` | `([lat, lon], radiusM) => string` — exported for testing |
| `elementCoordinates` | `(element) => [number, number] \| null` |
| `osmUrl` | `(element) => string` |

## `api/ticketmaster.js`

| Export | Signature |
|---|---|
| `fetchEvents` | `([lat, lon], radiusM, { daysAhead?, size?, signal? }) => Promise<any[]>` |
| `isTicketmasterEnabled` | `() => boolean` |

Returns `[]` rather than throwing when no key is configured.

## `api/weather.js`

| Export | Signature |
|---|---|
| `fetchWeather` | `([lat, lon], { signal? }) => Promise<Weather \| null>` |
| `describeWeatherCode` | `(wmoCode) => { label, icon }` |

## `services/eventsService.js`

| Export | Signature |
|---|---|
| `searchEvents` | `([lat, lon], radiusM, { signal? }) => Promise<{ events, sources }>` |
| `filterEvents` | `(events, { categories?, query?, maxDistance? }) => EventItem[]` |
| `countByCategory` | `(events) => Record<string, number>` |

`searchEvents` never rejects because one source failed — check `sources` for
per-source `state` (`'ok' \| 'error' \| 'skipped'`). It *does* reject on abort.

## `services/normalizers.js`

| Export | Signature |
|---|---|
| `osmElementToEvent` | `(element, origin) => EventItem \| null` |
| `ticketmasterEventToEvent` | `(event, origin) => EventItem \| null` |

Both return `null` for records that cannot be placed on a map or have no name.

## Hooks

| Hook | Returns |
|---|---|
| `useEvents(place, radiusM, filters)` | `{ events, allEvents, categoryCounts, sources, isLoading, error, refresh }` |
| `usePlaceSearch(query)` | `{ suggestions, isSearching, error }` — debounced, aborts superseded requests |
| `useWeather(place)` | `Weather \| null` — fails silently |
| `useGeolocation()` | `{ locate, isLocating, error, isSupported }` |
| `useRecentSearches()` | `{ recent, remember, clear }` — persisted |
| `useUrlSync()` | `{ initial, sync }` — reads and writes `?q&lat&lon&r` |
| `useDebounce(value, ms)` | the delayed value |
| `useLocalStorage(key, initial)` | `[value, setValue]` — storage failures degrade to memory |

## Utilities

| Module | Exports |
|---|---|
| `utils/geo` | `haversineDistance`, `formatDistance`, `boundingBoxAround`, `isValidCoordinate`, `nominatimBboxToLeaflet`, `zoomForRadius`, `clampLatitude`, `wrapLongitude` |
| `utils/date` | `parseDate`, `formatDate`, `formatTime`, `formatRelativeDay`, `startOfDay`, `toDateKey`, `toIsoSeconds`, `isPast`, `addDays` |
| `utils/string` | `humanizeTag`, `slugify`, `truncate`, `joinNonEmpty`, `looseIncludes`, `initial` |
| `utils/url` | `buildUrl`, `hostnameOf`, `safeExternalUrl`, `directionsUrl` |
| `utils/categories` | `categoryFromOsmTags`, `categoryFromSegment`, `getCategory`, `categoryColor`, `categoryIcon`, `categoryLabel` |
| `utils/cache` | `getCached`, `setCached`, `withCache`, `clearCache` |
| `utils/logger` | `createLogger(namespace)` — debug/info silenced in production |

`safeExternalUrl` returns `null` for anything that is not `http:` or `https:`,
which is what keeps a `javascript:` URL in an OSM `website` tag from becoming a
rendered anchor.
