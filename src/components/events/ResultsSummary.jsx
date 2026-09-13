import { Spinner } from '../ui/Spinner.jsx';
import styles from './ResultsSummary.module.css';

/**
 * The strip above the list: how many results, from which sources, and the
 * current weather at the searched place.
 *
 * @param {{
 *   place: import('../../api/nominatim.js').Place | null,
 *   total: number,
 *   shown: number,
 *   isLoading: boolean,
 *   sources: import('../../services/eventsService.js').SourceStatus[],
 *   weather: import('../../api/weather.js').Weather | null,
 * }} props
 */
export function ResultsSummary({ place, total, shown, isLoading, sources, weather }) {
  if (!place) return null;

  const failed = sources.filter((source) => source.state === 'error');
  const isFiltered = shown !== total;

  return (
    <div className={styles.summary}>
      <div className={styles.headline}>
        <h2 className={styles.title}>{place.name}</h2>
        {weather && (
          <span className={styles.weather} title={`${weather.label}, wind ${weather.windSpeed} km/h`}>
            {weather.icon} {weather.temperature}°C
          </span>
        )}
      </div>

      <p className={styles.count}>
        {isLoading ? (
          <>
            <Spinner size="sm" label="Scraping the map" />
            <span>Scraping the map around {place.name}…</span>
          </>
        ) : (
          <span>
            <strong>{shown}</strong> {shown === 1 ? 'place' : 'places'}
            {isFiltered && <span className={styles.muted}> of {total}</span>}
            {' · '}
            {sources
              .filter((source) => source.state === 'ok')
              .map((source) => source.label)
              .join(' + ') || 'no sources'}
          </span>
        )}
      </p>

      {failed.length > 0 && !isLoading && (
        <p className={styles.warning}>
          {failed.map((source) => source.label).join(', ')} unavailable — showing the rest.
        </p>
      )}
    </div>
  );
}
