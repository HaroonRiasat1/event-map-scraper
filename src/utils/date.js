/** Date parsing, formatting and grouping helpers. */

const MS_PER_DAY = 86_400_000;

/**
 * Parse anything date-like into a Date, or null when it cannot be trusted.
 * Sources hand us ISO strings, `YYYY-MM-DD`, or nothing at all.
 *
 * @param {string | number | Date | null | undefined} value
 * @returns {Date | null}
 */
export function parseDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * @param {string | Date | null} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string} e.g. "Fri, 12 Sep" — empty string when unparseable
 */
export function formatDate(value, options) {
  const date = parseDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...options,
  }).format(date);
}

/** @returns {string} e.g. "19:30" — empty string when the value has no time. */
export function formatTime(value) {
  const date = parseDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Coarse relative label used on cards: "Today", "Tomorrow", "In 3 days".
 *
 * @param {string | Date | null} value
 * @param {Date} [now]
 * @returns {string}
 */
export function formatRelativeDay(value, now = new Date()) {
  const date = parseDate(value);
  if (!date) return '';
  const days = Math.round((startOfDay(date) - startOfDay(now)) / MS_PER_DAY);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (Math.abs(days) < 7) return formatter.format(days, 'day');
  if (Math.abs(days) < 31) return formatter.format(Math.round(days / 7), 'week');
  return formatter.format(Math.round(days / 30), 'month');
}

export function startOfDay(value) {
  const date = parseDate(value) ?? new Date();
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** @returns {string} `YYYY-MM-DD` in local time. */
export function toDateKey(value) {
  const date = parseDate(value);
  if (!date) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** @returns {string} ISO-8601 with seconds, which Ticketmaster requires. */
export function toIsoSeconds(date) {
  return `${new Date(date).toISOString().split('.')[0]}Z`;
}

/**
 * @param {string | Date | null} value
 * @param {Date} [now]
 * @returns {boolean} true when the date is strictly in the past
 */
export function isPast(value, now = new Date()) {
  const date = parseDate(value);
  return date ? date.getTime() < now.getTime() : false;
}

/** @param {number} days @returns {Date} */
export function addDays(days, from = new Date()) {
  return new Date(from.getTime() + days * MS_PER_DAY);
}
