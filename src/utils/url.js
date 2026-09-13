/** URL building helpers. */

/**
 * Build a URL, skipping params that are `undefined`, `null` or `''` so callers
 * can pass optional values without branching.
 *
 * @param {string} base
 * @param {Record<string, string | number | boolean | undefined | null>} [params]
 * @returns {string}
 */
export function buildUrl(base, params = {}) {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** @returns {string} the hostname, or '' when the URL is malformed. */
export function hostnameOf(href) {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * Only http(s) links are safe to render as anchors; anything else (javascript:,
 * data:) is rejected.
 *
 * @param {unknown} href
 * @returns {string | null}
 */
export function safeExternalUrl(href) {
  if (typeof href !== 'string' || !href) return null;
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Deep link to directions, so a card can hand the user off to their maps app. */
export function directionsUrl([lat, lon]) {
  return buildUrl('https://www.google.com/maps/dir/', {
    api: 1,
    destination: `${lat},${lon}`,
  });
}
