/**
 * Source-specific payloads in, {@link import('../types').EventItem} out.
 *
 * Keeping normalisation here means the UI never learns what an Overpass tag or
 * a Ticketmaster `_embedded` block looks like — adding a source is a matter of
 * writing one more function in this file.
 */

import { elementCoordinates, osmUrl } from '../api/overpass.js';
import { categoryFromOsmTags, categoryFromSegment } from '../utils/categories.js';
import { haversineDistance } from '../utils/geo.js';
import { humanizeTag, joinNonEmpty, truncate } from '../utils/string.js';
import { safeExternalUrl } from '../utils/url.js';

/** Tags that describe *what* a place is, in the order we prefer to show them. */
const TYPE_TAG_KEYS = ['amenity', 'tourism', 'leisure', 'office', 'shop', 'building'];

/**
 * Compose a street address from the `addr:*` tags OSM uses.
 *
 * @param {Record<string, string>} tags
 * @returns {string}
 */
function osmAddress(tags) {
  const street = joinNonEmpty([tags['addr:street'], tags['addr:housenumber']], ' ');
  return (
    tags['addr:full'] ||
    joinNonEmpty([street, tags['addr:postcode'], tags['addr:city']]) ||
    ''
  );
}

/**
 * @param {import('../api/overpass.js').OverpassElement} element
 * @param {[number, number]} origin Search centre, for the distance field
 * @returns {import('../types').EventItem | null} null when unusable (no name or
 *   no coordinates — an unnamed node is noise on the map)
 */
export function osmElementToEvent(element, origin) {
  const coordinates = elementCoordinates(element);
  const tags = element.tags ?? {};
  const name = tags.name || tags['name:en'] || tags.operator || tags.brand;
  if (!coordinates || !name) return null;

  const typeKey = TYPE_TAG_KEYS.find((key) => tags[key]);
  const website = safeExternalUrl(tags.website || tags['contact:website'] || tags.url);

  return {
    id: `osm:${element.type}/${element.id}`,
    source: 'osm',
    name,
    category: categoryFromOsmTags(tags),
    subtitle: typeKey ? humanizeTag(tags[typeKey]) : 'Venue',
    coordinates,
    distance: haversineDistance(origin, coordinates),
    address: osmAddress(tags),
    url: website ?? osmUrl(element),
    // OSM venues are places, not occurrences. `start_date` on a venue means
    // "built in 1902", not "starts at 19:00", so it is deliberately not mapped
    // onto `startsAt` — only sources with real listings set that.
    startsAt: null,
    openingHours: tags.opening_hours ?? '',
    phone: tags.phone || tags['contact:phone'] || '',
    raw: tags,
  };
}

/**
 * @param {any} event Raw Discovery API event
 * @param {[number, number]} origin
 * @returns {import('../types').EventItem | null}
 */
export function ticketmasterEventToEvent(event, origin) {
  const venue = event?._embedded?.venues?.[0];
  const lat = Number(venue?.location?.latitude);
  const lon = Number(venue?.location?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const coordinates = /** @type {[number, number]} */ ([lat, lon]);
  const segment = event?.classifications?.[0]?.segment?.name;
  const attraction = event?._embedded?.attractions?.[0]?.name;
  // Discovery returns many sizes; the widest one looks best on a card.
  const image = [...(event.images ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0];
  const price = event.priceRanges?.[0];

  return {
    id: `ticketmaster:${event.id}`,
    source: 'ticketmaster',
    name: event.name,
    category: categoryFromSegment(segment),
    subtitle: truncate(joinNonEmpty([attraction, venue?.name], ' · '), 70) || 'Live event',
    coordinates,
    distance: haversineDistance(origin, coordinates),
    address: joinNonEmpty([venue?.address?.line1, venue?.city?.name]),
    url: safeExternalUrl(event.url) ?? undefined,
    imageUrl: image?.url,
    startsAt: event.dates?.start?.dateTime ?? event.dates?.start?.localDate ?? null,
    priceRange: price
      ? `${Math.round(price.min)}–${Math.round(price.max)} ${price.currency}`
      : '',
    raw: { segment: segment ?? '', venue: venue?.name ?? '' },
  };
}
