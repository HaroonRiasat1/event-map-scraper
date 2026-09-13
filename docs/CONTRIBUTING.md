# Contributing

## Setup

```bash
npm install
npm run dev
```

No API key is needed to develop. Copy `.env.example` to `.env` only if you want
the Ticketmaster source active.

## Before opening a pull request

```bash
npm run lint
npm run build
```

Both must pass. `npm run build` catches import mistakes that the dev server's
lazy module graph will happily hide.

## Conventions

**Layering.** Imports point downwards only:

```
components → hooks → services → api → utils/constants
```

If a component imports from `api/`, the logic belongs in a hook or a service.
Nothing in `utils/` may import React.

**No magic values.** Numbers, endpoints, TTLs and radii live in
`constants/config.js`. Categories and their colours live in
`constants/categories.js` — and because `api/overpass.js` derives its query from
those matchers, adding a category is how you add a tag to the scraper.

**Comments explain why.** The code says what it does. A comment earns its place
by recording a constraint that is not visible locally — a rate limit, a Leaflet
quirk, a query shape that is fast for a non-obvious reason.

**JSDoc on anything exported.** The project uses JSDoc instead of TypeScript to
stay a zero-config React app; `jsconfig.json` gives editors the same
autocomplete. Types shared across modules go in `src/types/index.js`.

**Styling.** CSS Modules per component, values from `styles/tokens.css`. The one
exception is `components/map/markers.css`: Leaflet injects marker HTML into the
DOM itself, so those class names must not be hashed.

**Async.** Every fetch goes through `api/client.js` and accepts an
`AbortSignal`. Any effect that fetches must abort on cleanup — a slow response
must never overwrite a newer one.

## Gotchas worth knowing

- **Overpass regex clauses are a trap.** `["amenity"~"^(a|b|c)$"]` bypasses the
  tag index and can hang for minutes. Use one exact-match clause per value. Same
  for key-only filters like `["event"]`.
- **Leaflet's `flyTo` and `stop()` both produce `NaN`** if the map container has
  not been measured yet. `MapController` re-measures and uses `setView` /
  `fitBounds` instead.
- **Leaflet panes need a stacking context.** `EventMap`'s container sets
  `isolation: isolate`, otherwise Leaflet's internal z-indexes (up to 1000)
  paint over the mobile bottom sheet.
- **OSM `start_date` is not an event time.** On a venue it means "built in 1902".
  Only sources with real listings set `startsAt`.
- **Coordinate arrays are new objects every render.** Destructure to `lat`/`lon`
  before putting them in a dependency array, or the effect loops forever.

## Adding a data source

See [DATA-SOURCES.md](DATA-SOURCES.md#adding-a-fifth-source).
