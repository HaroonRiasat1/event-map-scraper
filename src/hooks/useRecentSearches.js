import { useCallback } from 'react';
import { SEARCH, STORAGE_KEYS } from '../constants/config.js';
import { useLocalStorage } from './useLocalStorage.js';

/**
 * The user's recent places, persisted between visits.
 *
 * @returns {{
 *   recent: import('../api/nominatim.js').Place[],
 *   remember: (place: import('../api/nominatim.js').Place) => void,
 *   clear: () => void,
 * }}
 */
export function useRecentSearches() {
  const [recent, setRecent] = useLocalStorage(STORAGE_KEYS.recentSearches, []);

  const remember = useCallback(
    (place) => {
      if (!place?.id) return;
      setRecent((previous) => {
        const withoutDuplicate = previous.filter((entry) => entry.id !== place.id);
        return [place, ...withoutDuplicate].slice(0, SEARCH.maxRecentSearches);
      });
    },
    [setRecent],
  );

  const clear = useCallback(() => setRecent([]), [setRecent]);

  return { recent: Array.isArray(recent) ? recent : [], remember, clear };
}
