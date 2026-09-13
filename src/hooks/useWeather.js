import { useEffect, useState } from 'react';
import { fetchWeather } from '../api/weather.js';
import { isAbortError } from '../api/client.js';

/**
 * Current conditions at a place. Failure is silent — weather is a nice-to-have
 * and should never produce an error banner over the results.
 *
 * @param {import('../api/nominatim.js').Place | null} place
 * @returns {import('../api/weather.js').Weather | null}
 */
export function useWeather(place) {
  const [weather, setWeather] = useState(null);
  // Destructured so the dependency array holds plain numbers: `coordinates` is
  // a fresh array on every render and would re-trigger the effect forever.
  const [lat, lon] = place?.coordinates ?? [];

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      setWeather(null);
      return undefined;
    }

    const controller = new AbortController();

    fetchWeather([lat, lon], { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setWeather(result);
      })
      .catch((error) => {
        if (!isAbortError(error)) setWeather(null);
      });

    return () => controller.abort();
  }, [lat, lon]);

  return weather;
}
