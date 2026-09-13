# Data sources

Four external services. Three need no key; one is optional.

## 1. Nominatim — geocoding

| | |
|---|---|
| Endpoint | `https://nominatim.openstreetmap.org/search`, `/reverse` |
| Key | None |
| Module | [`src/api/nominatim.js`](../src/api/nominatim.js) |
| Used for | Turning `turku` into coordinates + a city bounding box; "Near me" reverse lookup |

**Constraints.** The [usage policy](https://operations.osmfoundation.org/policies/nominatim/)
caps you at **one request per second** and requires an identifiable application.
`rateLimit()` from `api/client.js` serialises every call through a single queue,
so the limit holds no matter how many components ask at once. Results are cached
for 24 hours.

A browser cannot set `User-Agent`, so the app identifies itself by `Referer`
(automatic) and sends `Accept-Language` for localised place names. If you deploy
this at real volume, run your own Nominatim instance.

## 2. Overpass — the map scraper

| | |
|---|---|
| Endpoint | `https://overpass-api.de/api/interpreter` (+ two fallback mirrors) |
| Key | None |
| Module | [`src/api/overpass.js`](../src/api/overpass.js) |
| Used for | Every venue on the map |

**Query shape matters enormously.** The query is generated from the category
matchers in `constants/categories.js` as one exact-match clause per tag:

```overpassql
[out:json][timeout:18];
(
  nwr["amenity"="theatre"](around:5000,60.451593,22.266999);
  nwr["amenity"="cinema"](around:5000,60.451593,22.266999);
  …
);
out center tags 400;
```

The tidier-looking alternative, a regex alternation per key —
`nwr["amenity"~"^(theatre|cinema|…)$"]` — **is not usable**. A regex cannot use
the tag-value index, so Overpass scans instead, and a 5 km city query that
returns in under a second as exact matches can run for minutes or never return
at all. The same applies to key-only clauses such as `nwr["event"]`, which is why
there are none, despite `event=*` being exactly the tag you would want.

**Constraints.** Overpass instances are volunteer-run and queue requests per IP.
The app therefore:

- tries three mirrors in order, moving on after 20 seconds
- does **not** retry the same mirror — retrying a queued request only lengthens the queue
- caches results for an hour, keyed by rounded coordinates + radius
- caps output at `MAX_RESULTS` (400)

When every mirror is busy the source is reported as `error` in the footer and
the rest of the app carries on.

## 3. Ticketmaster Discovery — real dated events (optional)

| | |
|---|---|
| Endpoint | `https://app.ticketmaster.com/discovery/v2/events.json` |
| Key | **Required** — `VITE_TICKETMASTER_API_KEY` |
| Module | [`src/api/ticketmaster.js`](../src/api/ticketmaster.js) |
| Used for | Ticketed events with real dates, images and prices |

Without a key the module reports `isTicketmasterEnabled() === false`, the
aggregator skips it, and the footer shows it as `skipped`. Free tier: 5000
requests/day, 5 requests/second. Coverage is strong in North America and Western
Europe, thin elsewhere — another reason the OSM source is the default.

## 4. Open-Meteo — weather

| | |
|---|---|
| Endpoint | `https://api.open-meteo.com/v1/forecast` |
| Key | None |
| Module | [`src/api/weather.js`](../src/api/weather.js) |
| Used for | The temperature badge beside the city name |

Free for non-commercial use, no key, no attribution requirement beyond a credit
(which the footer carries). Failure is silent by design — a missing weather badge
should never produce an error banner over the results.

## Adding a fifth source

Two files, plus one entry:

1. **`src/api/yoursource.js`** — fetch and return the raw payload. Use `request()`
   from `api/client.js` so you inherit timeouts, retries and abort handling.
   Export an `isEnabled()` predicate if it needs configuration.

2. **`src/services/normalizers.js`** — add `yourSourceToEvent(raw, origin)`
   returning an [`EventItem`](../src/types/index.js), or `null` to drop the record.
   Set `category` via `utils/categories.js` and `distance` via `haversineDistance`.

3. **`src/services/eventsService.js`** — add an entry to the `SOURCES` array:

```js
{
  id: 'yoursource',
  label: 'Your Source',
  isEnabled: () => true,
  fetch: (center, radius, signal) => fetchYourSource(center, radius, { signal }),
  normalize: (items, center) =>
    items.map((item) => yourSourceToEvent(item, center)).filter(Boolean),
}
```

Nothing in `components/` changes. The new source is fanned out in parallel,
merged, de-duplicated, ranked, and gets its own status dot in the footer.
