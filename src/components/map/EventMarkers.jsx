import { Marker, Popup } from 'react-leaflet';
import { categoryLabel } from '../../utils/categories.js';
import { formatDate, formatTime } from '../../utils/date.js';
import { formatDistance } from '../../utils/geo.js';
import { hostnameOf } from '../../utils/url.js';
import { createMarkerIcon } from './markerIcon.js';
import styles from './EventMarkers.module.css';

/**
 * One marker per result, with a popup summarising it.
 *
 * @param {{
 *   events: import('../../types').EventItem[],
 *   selectedId: string | null,
 *   onSelect: (event: import('../../types').EventItem) => void,
 * }} props
 */
export function EventMarkers({ events, selectedId, onSelect }) {
  return events.map((event) => (
    <Marker
      key={event.id}
      position={event.coordinates}
      icon={createMarkerIcon(event.category, event.id === selectedId)}
      eventHandlers={{ click: () => onSelect(event) }}
      // Keep dated events above plain venues when pins overlap.
      zIndexOffset={event.startsAt ? 500 : 0}
    >
      <Popup>
        <article className={styles.popup}>
          <p className={styles.category}>{categoryLabel(event.category)}</p>
          <h3 className={styles.name}>{event.name}</h3>
          <p className={styles.meta}>
            {event.subtitle}
            {event.address ? ` · ${event.address}` : ''}
          </p>

          {event.startsAt && (
            <p className={styles.when}>
              🗓 {formatDate(event.startsAt)}
              {formatTime(event.startsAt) && ` · ${formatTime(event.startsAt)}`}
            </p>
          )}

          <p className={styles.distance}>{formatDistance(event.distance)} from centre</p>

          {event.url && (
            <a
              className={styles.link}
              href={event.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              {hostnameOf(event.url) || 'Open link'} ↗
            </a>
          )}
        </article>
      </Popup>
    </Marker>
  ));
}
