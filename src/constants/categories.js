/**
 * Category taxonomy.
 *
 * Every source (OpenStreetMap tags, Ticketmaster segments) is normalised into
 * one of these ids, so filtering, colouring and legends have a single source of
 * truth. `matchers` maps raw `key=value` tag pairs onto a category.
 *
 * The matchers are also what `api/overpass.js` turns into its query, so this
 * list is the one place that decides what counts as a venue. Keep it tight:
 * broad tags such as `leisure=pitch` or `tourism=artwork` match thousands of
 * objects per city and drown the genuine venues.
 */

/** @typedef {'music'|'nightlife'|'theatre'|'arts'|'sports'|'community'|'food'|'family'|'other'} CategoryId */

export const CATEGORIES = [
  {
    id: 'music',
    label: 'Music',
    icon: '🎵',
    color: '#f472b6',
    matchers: ['amenity=music_venue', 'amenity=concert_hall'],
  },
  {
    id: 'nightlife',
    label: 'Nightlife',
    icon: '🍸',
    color: '#a78bfa',
    matchers: ['amenity=nightclub', 'amenity=bar', 'amenity=pub'],
  },
  {
    id: 'theatre',
    label: 'Theatre & Film',
    icon: '🎭',
    color: '#f59e0b',
    matchers: ['amenity=theatre', 'amenity=cinema'],
  },
  {
    id: 'arts',
    label: 'Arts & Culture',
    icon: '🖼️',
    color: '#38bdf8',
    matchers: [
      'amenity=arts_centre',
      'tourism=museum',
      'tourism=gallery',
    ],
  },
  {
    id: 'sports',
    label: 'Sports',
    icon: '⚽',
    color: '#34d399',
    matchers: [
      'leisure=stadium',
      'leisure=sports_centre',
      'leisure=sports_hall',
      'leisure=ice_rink',
    ],
  },
  {
    id: 'community',
    label: 'Community',
    icon: '🏛️',
    color: '#60a5fa',
    matchers: [
      'amenity=community_centre',
      'amenity=events_venue',
      'amenity=conference_centre',
      'amenity=exhibition_centre',
      'amenity=social_centre',
      'office=events_venue',
    ],
  },
  {
    id: 'food',
    label: 'Food & Markets',
    icon: '🍜',
    color: '#fb923c',
    matchers: ['amenity=marketplace', 'amenity=food_court', 'amenity=biergarten'],
  },
  {
    id: 'family',
    label: 'Family',
    icon: '🎡',
    color: '#facc15',
    matchers: ['tourism=theme_park', 'tourism=zoo', 'tourism=aquarium'],
  },
  {
    id: 'other',
    label: 'Other',
    icon: '📍',
    color: '#94a3b8',
    matchers: [],
  },
];

export const FALLBACK_CATEGORY_ID = 'other';

/** Fast lookup: category id -> category object. */
export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

/** Fast lookup: 'amenity=theatre' -> category id. Built once at module load. */
export const CATEGORY_BY_MATCHER = CATEGORIES.reduce((acc, category) => {
  for (const matcher of category.matchers) acc[matcher] = category.id;
  return acc;
}, {});

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);
