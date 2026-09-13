/** Geographic maths and formatting helpers. */

const EARTH_RADIUS_M = 6_371_000;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

/**
 * Great-circle distance between two points.
 *
 * @param {[number, number]} a `[lat, lon]`
 * @param {[number, number]} b `[lat, lon]`
 * @returns {number} distance in metres
 */
export function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Human-readable distance: metres below 1 km, otherwise kilometres.
 *
 * @param {number} metres
 * @returns {string}
 */
export function formatDistance(metres) {
  if (!Number.isFinite(metres)) return '';
  if (metres < 1000) return `${Math.round(metres / 10) * 10} m`;
  const km = metres / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/**
 * Expand a point into a square bounding box, which is what most event APIs
 * accept in place of a radius.
 *
 * @param {[number, number]} center `[lat, lon]`
 * @param {number} radiusM
 * @returns {{ south: number, west: number, north: number, east: number }}
 */
export function boundingBoxAround([lat, lon], radiusM) {
  const latDelta = (radiusM / EARTH_RADIUS_M) * (180 / Math.PI);
  // Longitude degrees shrink towards the poles; guard against a divide-by-zero
  // at the poles themselves.
  const cosLat = Math.max(Math.cos(toRadians(lat)), 1e-6);
  const lonDelta = latDelta / cosLat;
  return {
    south: clampLatitude(lat - latDelta),
    west: wrapLongitude(lon - lonDelta),
    north: clampLatitude(lat + latDelta),
    east: wrapLongitude(lon + lonDelta),
  };
}

/** @returns {boolean} true when `[lat, lon]` is a usable coordinate pair. */
export function isValidCoordinate(value) {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    Math.abs(value[0]) <= 90 &&
    Math.abs(value[1]) <= 180
  );
}

export const clampLatitude = (lat) => Math.min(90, Math.max(-90, lat));

export function wrapLongitude(lon) {
  let value = lon;
  while (value > 180) value -= 360;
  while (value < -180) value += 360;
  return value;
}

/**
 * Leaflet wants `[[south, west], [north, east]]`; Nominatim returns
 * `[south, north, west, east]` as strings. Bridge the two.
 *
 * @param {string[]} [boundingbox]
 * @returns {[[number, number], [number, number]] | null}
 */
export function nominatimBboxToLeaflet(boundingbox) {
  if (!Array.isArray(boundingbox) || boundingbox.length !== 4) return null;
  const [south, north, west, east] = boundingbox.map(Number);
  if (![south, north, west, east].every(Number.isFinite)) return null;
  return [
    [south, west],
    [north, east],
  ];
}

/**
 * Zoom level that roughly fits a radius on a ~600 px tall viewport. Used when a
 * result has no bounding box to fit.
 *
 * @param {number} radiusM
 * @returns {number}
 */
export function zoomForRadius(radiusM) {
  if (radiusM <= 1000) return 15;
  if (radiusM <= 2500) return 14;
  if (radiusM <= 5000) return 13;
  if (radiusM <= 10_000) return 12;
  return 10;
}
