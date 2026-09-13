import { useCallback, useEffect, useState } from 'react';
import { createLogger } from '../utils/logger.js';

const log = createLogger('hook:localStorage');

/**
 * `useState` that persists to `localStorage`.
 *
 * Reads and writes are guarded: private browsing, disabled storage and quota
 * errors all fall back to in-memory state instead of crashing the app.
 *
 * @template T
 * @param {string} key
 * @param {T} initialValue
 * @returns {[T, (value: T | ((prev: T) => T)) => void]}
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch (error) {
      log.debug('read failed', key, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      log.debug('write failed', key, error);
    }
  }, [key, value]);

  const update = useCallback((next) => setValue(next), []);

  return [value, update];
}
