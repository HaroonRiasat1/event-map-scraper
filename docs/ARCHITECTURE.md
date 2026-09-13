# Architecture

## Goals

1. **Adding a data source should touch two files.** One module in `api/`, one
   normaliser in `services/normalizers.js` — nothing in the UI changes.
2. **The UI never learns what an API looks like.** Components consume a single
   `EventItem` shape regardless of origin.
3. **A failing source degrades, never breaks.** Overpass being busy should cost
   you the venue list, not the page.

## Layers

```
┌──────────────────────────────────────────────────────────┐
│ components/   presentational React, grouped by feature   │
├──────────────────────────────────────────────────────────┤
│ hooks/        stateful glue: fetching, debouncing, URL    │
├──────────────────────────────────────────────────────────┤
│ services/     aggregation, normalisation, ranking         │
├──────────────────────────────────────────────────────────┤
│ api/          one module per external service (HTTP only) │
├──────────────────────────────────────────────────────────┤
│ utils/ constants/   pure helpers, no React, no network    │
└──────────────────────────────────────────────────────────┘
```

Imports only ever point **downwards**. A `utils/` module importing React, or an
`api/` module importing a component, is a bug.

## Data flow for one search

```
User types "turku"
   │
   ▼
SearchBar ──► usePlaceSearch ──► api/nominatim.searchPlaces
   │                                     │ (debounced 350 ms, 1 req/s, cached 24 h)
   │                                     ▼
   │                              Place[] suggestions
   ▼
User picks "Turku, Finland"
   │
   ▼
App.place  ──────────────────────────────────────────┐
   │                                                  │
   ▼                                                  ▼
useEvents ──► services/eventsService.searchEvents   useWeather
                   │                                  │
        ┌──────────┴───────────┐                      ▼
        ▼                      ▼                 api/weather
  api/overpass          api/ticketmaster
  (always on)           (skipped without a key)
        │                      │
        └──────────┬───────────┘
                   ▼
         normalizers → EventItem[]
                   ▼
          dedupe → rank → cap at 400
                   ▼
    ┌──────────────┴──────────────┐
    ▼                             ▼
EventList (sidebar)          EventMap (markers)
```

Category and text filters are applied by `filterEvents` to the already-fetched
array, so changing a chip never hits the network. Only **place** and **radius**
trigger a refetch.

## State ownership

| State | Lives in | Why |
|---|---|---|
| `place`, `radius` | `App` | Two siblings (list and map) need it, and it is mirrored into the URL |
| `categories`, `query` | `App` | Filters apply to both panes |
| `selectedId` | `App` | Selection is bidirectional: click a card → focus a marker, and back |
| Search box text | `SearchBar` | Nothing else cares until a place is committed |
| Fetched results | `useEvents` | Tied to the request lifecycle, including aborts |
| Recent searches | `localStorage` via `useRecentSearches` | Must outlive the session |
| Response cache | `sessionStorage` via `utils/cache` | Rate-limit protection across reloads |

## Request discipline

Every network call goes through `api/client.js`, which provides:

- **Timeouts** — 30 s per attempt, composed with the caller's `AbortSignal`
- **Retries** — up to two, only for 408/425/429/5xx, with exponential back-off and jitter
- **Aborts** — a superseded search cancels its in-flight requests; `isAbortError`
  distinguishes "the user moved on" from "this failed"
- **`ApiError`** — carries `status`, `source` and `retryable` so callers can decide

`rateLimit()` serialises Nominatim calls to one per second, as its usage policy
requires. Overpass additionally fails over between mirrors inside `overpass.js`.

## Caching

`utils/cache.js` is a two-tier TTL cache: an in-memory `Map` for the fast path
and `sessionStorage` so results survive a reload. TTLs live in `constants/config.js`:

| Namespace | TTL | Rationale |
|---|---|---|
| `geocode` | 24 h | Cities do not move |
| `venues` | 1 h | OSM edits land slowly, and Overpass is community-funded |
| `events` | 15 min | Listings change during the day |
| `weather` | 10 min | Matches Open-Meteo's own update cadence |

Storage failures (private mode, quota) silently degrade to memory-only.

## Error handling

Three levels, deliberately:

1. **Per source** — `Promise.allSettled` in `eventsService`; a rejected source
   becomes a `SourceStatus` with `state: 'error'`, rendered as a dot in the footer
   and a one-line warning above the list. Everything else still renders.
2. **Per view** — `ErrorBanner` with a retry that re-runs the search.
3. **Whole app** — `ErrorBoundary` catches render-time exceptions and offers a
   reload instead of a blank page.

## Map specifics

- Markers are Leaflet `divIcon`s, not images, so they can be coloured from the
  category palette and animated in CSS. Icons are cached per category + selected
  state, since Leaflet rebuilds markers on every pan.
- `MapController` is the only place that touches the Leaflet instance
  imperatively. It re-measures the container before moving, because `flyTo`
  divides by the container size and yields `NaN` if that size is still zero on
  first paint.
- A `ResizeObserver` calls `invalidateSize()` whenever the layout shifts around
  the map — the mobile bottom sheet makes this frequent.
