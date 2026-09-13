/** Category resolution — raw source metadata in, canonical category id out. */

import {
  CATEGORY_BY_ID,
  CATEGORY_BY_MATCHER,
  FALLBACK_CATEGORY_ID,
} from '../constants/categories.js';

/**
 * Resolve an OSM tag bag to a category id.
 *
 * Tags are checked against the `key=value` matchers declared on each category;
 * the first hit wins, so the taxonomy order in `constants/categories.js`
 * doubles as a precedence list.
 *
 * @param {Record<string, string>} [tags]
 * @returns {string} a category id
 */
export function categoryFromOsmTags(tags = {}) {
  for (const [key, value] of Object.entries(tags)) {
    const hit = CATEGORY_BY_MATCHER[`${key}=${value}`];
    if (hit) return hit;
  }
  // Free-form event/festival tags carry no value we can match on.
  if (tags.event || tags.festival) return 'community';
  return FALLBACK_CATEGORY_ID;
}

/** Ticketmaster segment names map cleanly onto our taxonomy. */
const SEGMENT_TO_CATEGORY = {
  music: 'music',
  sports: 'sports',
  'arts & theatre': 'theatre',
  film: 'theatre',
  miscellaneous: 'other',
};

/**
 * @param {string} [segmentName] Ticketmaster classification segment
 * @returns {string} a category id
 */
export function categoryFromSegment(segmentName) {
  return SEGMENT_TO_CATEGORY[String(segmentName).toLowerCase()] ?? FALLBACK_CATEGORY_ID;
}

/**
 * @param {string} id
 * @returns {{ id: string, label: string, icon: string, color: string }}
 */
export function getCategory(id) {
  return CATEGORY_BY_ID[id] ?? CATEGORY_BY_ID[FALLBACK_CATEGORY_ID];
}

/** Convenience accessors used by the map and the cards. */
export const categoryColor = (id) => getCategory(id).color;
export const categoryIcon = (id) => getCategory(id).icon;
export const categoryLabel = (id) => getCategory(id).label;
