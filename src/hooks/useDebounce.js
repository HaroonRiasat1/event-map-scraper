import { useEffect, useState } from 'react';

/**
 * Delay propagating a rapidly changing value.
 *
 * Used to keep keystrokes from becoming geocoding requests.
 *
 * @template T
 * @param {T} value
 * @param {number} delayMs
 * @returns {T} the value as it stood `delayMs` ago
 */
export function useDebounce(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
