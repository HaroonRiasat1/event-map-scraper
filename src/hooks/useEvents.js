import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isAbortError } from '../api/client.js';
import { countByCategory, filterEvents, searchEvents } from '../services/eventsService.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('hook:events');

/**
 * Fetch and filter results for a place.
 *
 * Network work re-runs only when the place or radius changes; category and text
 * filters are applied to the cached result set, which keeps filtering instant.
 *
 * @param {import('../api/nominatim.js').Place | null} place
 * @param {number} radiusM
 * @param {{ categories?: string[], query?: string }} [filters]
 */
export function useEvents(place, radiusM, filters = {}) {
  const [events, setEvents] = useState([]);
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const abortRef = useRef(null);
  // A counter, bumped by `refresh()`, that re-triggers the effect on demand.
  const [reloadToken, setReloadToken] = useState(0);

  const { categories = [], query = '' } = filters;
  // Destructured so the dependency array holds plain numbers: `coordinates` is
  // a fresh array on every render and would re-trigger the effect forever.
  const [lat, lon] = place?.coordinates ?? [];

  useEffect(() => {
    abortRef.current?.abort();

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setEvents([]);
      setSources([]);
      setError('');
      return undefined;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setError('');

    searchEvents([lat, lon], radiusM, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setEvents(result.events);
        setSources(result.sources);
        if (!result.events.length && result.sources.every((s) => s.state !== 'ok')) {
          setError('Every data source failed. Check your connection and try again.');
        }
      })
      .catch((err) => {
        if (isAbortError(err)) return;
        log.error('search failed', err);
        setEvents([]);
        setError(err?.message ?? 'Search failed.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [lat, lon, radiusM, reloadToken]);

  const visibleEvents = useMemo(
    () => filterEvents(events, { categories, query }),
    [events, categories, query],
  );

  const categoryCounts = useMemo(() => countByCategory(events), [events]);

  const refresh = useCallback(() => setReloadToken((token) => token + 1), []);

  return {
    events: visibleEvents,
    allEvents: events,
    categoryCounts,
    sources,
    isLoading,
    error,
    refresh,
  };
}
