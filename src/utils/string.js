/** Small string helpers shared across sources and UI. */

/** `community_centre` -> `Community centre`. */
export function humanizeTag(value = '') {
  const spaced = String(value).replace(/[_-]+/g, ' ').trim();
  return spaced ? spaced[0].toUpperCase() + spaced.slice(1) : '';
}

/** `Turku Kaupunginteatteri` -> `turku-kaupunginteatteri`. */
export function slugify(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Trim to `max` characters on a word boundary, adding an ellipsis. */
export function truncate(value = '', max = 120) {
  const text = String(value).trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Drop empty parts and join with a separator — handy for address lines. */
export function joinNonEmpty(parts, separator = ', ') {
  return parts.filter((part) => typeof part === 'string' && part.trim()).join(separator);
}

/** Case- and accent-insensitive "does haystack contain needle". */
export function looseIncludes(haystack = '', needle = '') {
  const normalize = (s) =>
    String(s)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  return normalize(haystack).includes(normalize(needle));
}

/** First grapheme of a name, used as a marker glyph fallback. */
export function initial(value = '?') {
  return [...String(value).trim()][0]?.toUpperCase() ?? '?';
}
