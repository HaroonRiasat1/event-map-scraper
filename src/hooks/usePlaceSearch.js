import { useEffect, useRef, useState } from 'react';
import { searchPlaces } from '../api/nominatim.js';
import { isAbortError } from '../api/client.js';
import { SEARCH } from '../constants/config.js';
import { createLogger } from '../utils/logger.js';
import { useDebounce } from './useDebounce.js';

const log = createLogger('hook:placeSearch');

/**
 * Live place suggestions for the search box.
 *
 * The query is debounced, and every superseded request is aborted so a slow
 * response can never overwrite a newer one.
 *
 * @param {string} query
 * @returns {{ suggestions: import('../api/nominatim.js').Place[], isSearching: boolean, error: string }}
 */
export function usePlaceSearch(query) {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  const debouncedQuery = useDebounce(query, SEARCH.debounceMs);
  const abortRef = useRef(null);

  useEffect(() => {
    abortRef.current?.abort();

    const trimmed = debouncedQuery.trim();
    if (trimmed.length < SEARCH.minQueryLength) {
      setSuggestions([]);
      setIsSearching(false);
      setError('');
      return undefined;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);

    searchPlaces(trimmed, { signal: controller.signal })
      .then((places) => {
        if (controller.signal.aborted) return;
        setSuggestions(places);
        setError('');
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        log.warn('suggestions failed', err);
        setSuggestions([]);
        setError('Place lookup is unavailable right now.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsSearching(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  return { suggestions, isSearching, error };
}
