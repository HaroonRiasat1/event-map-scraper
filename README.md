<div align="center">

# 🗺️ Event Map Scraper

**Type a city. Get every venue, festival and live event around it, on a map.**

Search `Turku` — or Berlin, Lisbon, Osaka — and the app scrapes live OpenStreetMap
data for the places where things actually happen nearby, plots them, and lets you
filter by category, radius and name.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## Why it exists

"What's on near me?" is a surprisingly annoying question. Event sites want your
location and an account; map apps show you restaurants. This app takes the other
route: it queries the **OpenStreetMap database directly** for every theatre,
club, arena, museum, community centre, market and festival within a radius of the
city you searched — no key, no login, no tracking — and layers real ticketed
events on top when you supply an optional Ticketmaster key.

## Features

| | |
|---|---|
| 🔎 **City search with live suggestions** | Debounced geocoding, keyboard navigation, recent searches remembered locally |
| 🛰️ **Live map scraping** | Overpass API queries OpenStreetMap in real time — nothing is pre-baked |
| 🎟️ **Real dated events** | Optional Ticketmaster source, merged and de-duplicated against venue data |
| 🎨 **Category filtering** | Nine colour-coded categories, with live counts, applied instantly client-side |
| 📍 **Near me** | One-tap geolocation with reverse geocoding |
| 🌤️ **Weather at the destination** | Current conditions from Open-Meteo — it matters for outdoor events |
| 🔗 **Shareable searches** | The current search lives in the URL: `?q=Turku&lat=…&lon=…&r=5000` |
| ♿ **Accessible** | ARIA combobox, keyboard-navigable results, reduced-motion support |
| 📱 **Responsive** | Split view on desktop, map-with-bottom-sheet on mobile |

## Quick start

```bash
git clone https://github.com/HaroonRiasat1/event-map-scraper.git
cd event-map-scraper
npm install
npm run dev
```

Open <http://localhost:5173> and search for `Turku`.

**No API key is required.** The app is fully functional out of the box.

### Optional: enable ticketed events

```bash
cp .env.example .env
# then add a free key from https://developer.ticketmaster.com/
echo "VITE_TICKETMASTER_API_KEY=your_key_here" >> .env
```

Without a key the Ticketmaster source reports itself as `skipped` in the footer
and the app carries on with OpenStreetMap data alone.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server on port 5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Project structure

```
src/
├── api/            One module per external service — HTTP only, no app logic
│   ├── client.js       Shared fetch wrapper: timeouts, retries, aborts, ApiError
│   ├── nominatim.js    Geocoding + reverse geocoding (rate-limited to 1 req/s)
│   ├── overpass.js     The map scraper: Overpass QL builder + mirror failover
│   ├── ticketmaster.js Optional ticketed-event source
│   └── weather.js      Open-Meteo current conditions
├── services/       Cross-source business logic
│   ├── normalizers.js  Raw source payloads → one canonical EventItem shape
│   └── eventsService.js Parallel fan-out, dedupe, rank, filter
├── hooks/          Stateful React logic, one concern each
├── components/     Presentational, grouped by feature (layout/search/map/events/filters/ui)
├── utils/          Pure, framework-free helpers (geo, date, string, url, cache, logger)
├── constants/      Config and the category taxonomy — the only magic numbers
├── styles/         Design tokens + global styles
└── types/          JSDoc typedefs shared across the app
```

The dependency rule is one-directional:

```
components → hooks → services → api → utils/constants
```

Nothing in `utils/` imports React; nothing in `api/` knows the app exists. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the reasoning.

## Documentation

- **[Architecture](docs/ARCHITECTURE.md)** — layers, data flow, state ownership
- **[Data sources](docs/DATA-SOURCES.md)** — every API used, quotas, and how to add another
- **[API reference](docs/API.md)** — the public surface of each module
- **[Contributing](docs/CONTRIBUTING.md)** — conventions and how to get set up

## How the scraping works

1. **Geocode** — Nominatim turns `turku` into `60.4516, 22.2670` plus a city bounding box.
2. **Build a query** — `overpass.js` generates Overpass QL for every event-ish tag
   (`amenity=theatre`, `tourism=museum`, `leisure=stadium`, `event=*`, …) within the radius.
3. **Scrape** — the query runs against a live OpenStreetMap mirror, failing over if one is busy.
4. **Normalise** — nodes, ways and relations all collapse into a single `EventItem` shape.
5. **Merge** — Ticketmaster results (if configured) are merged in and de-duplicated by name + position.
6. **Rank** — dated events first, soonest first; then venues by distance.

Results are cached per location and radius, so panning back to a previous search
costs nothing and keeps the community-run Overpass servers happy.

## Attribution

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL),
geocoding by [Nominatim](https://nominatim.org/), tiles by [CARTO](https://carto.com/attributions),
weather by [Open-Meteo](https://open-meteo.com/).
Please respect the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/)
if you deploy this.

## License

[MIT](LICENSE)
