/**
 * Shared type definitions.
 *
 * The project uses JSDoc rather than TypeScript so it stays a zero-build-step
 * React app while still giving editors full autocomplete. Importing this file
 * for its side effects is never necessary — `@typedef`s are global to the
 * project via `jsconfig.json`.
 */

/**
 * A normalised result, whatever source it came from.
 *
 * @typedef {object} EventItem
 * @property {string} id            Globally unique, e.g. `osm:node/26110335`
 * @property {'osm'|'ticketmaster'} source
 * @property {string} name
 * @property {string} category      A {@link import('../constants/categories.js').CategoryId}
 * @property {string} subtitle      Venue type or performer, shown under the name
 * @property {[number, number]} coordinates `[lat, lon]`
 * @property {number} distance      Metres from the search centre
 * @property {string} [address]
 * @property {string} [url]         Official or OSM link
 * @property {string} [imageUrl]
 * @property {string | null} [startsAt]  ISO timestamp, when the source has one
 * @property {string} [priceRange]
 * @property {string} [openingHours]
 * @property {string} [phone]
 * @property {Record<string, string>} [raw] Original tags, for the detail view
 */

/**
 * @typedef {object} SearchState
 * @property {import('../api/nominatim.js').Place | null} place
 * @property {number} radius   Metres
 * @property {string[]} categories Selected category ids; empty means "all"
 * @property {string} query    The free-text filter applied to results
 */

export {};
