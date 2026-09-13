import { categoryColor, categoryIcon, categoryLabel } from '../../utils/categories.js';
import { formatDate, formatRelativeDay, formatTime } from '../../utils/date.js';
import { formatDistance } from '../../utils/geo.js';
import { truncate } from '../../utils/string.js';
import { directionsUrl, hostnameOf } from '../../utils/url.js';
import { Badge } from '../ui/Badge.jsx';
import styles from './EventCard.module.css';

/**
 * A single result. Selecting the card focuses its marker on the map.
 *
 * @param {{
 *   event: import('../../types').EventItem,
 *   isSelected: boolean,
 *   onSelect: (event: import('../../types').EventItem) => void,
 * }} props
 */
export function EventCard({ event, isSelected, onSelect }) {
  const color = categoryColor(event.category);

  return (
    <li data-id={event.id}>
      <article
        className={`${styles.card} ${isSelected ? styles.selected : ''}`}
        style={{ '--accent': color }}
        // The whole card is the click target for focusing the map; the links
        // inside it stop propagation so they still behave like links.
        onClick={() => onSelect(event)}
        onKeyDown={(keyEvent) => {
          if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
            keyEvent.preventDefault();
            onSelect(event);
          }
        }}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
      >
        {event.imageUrl ? (
          <img className={styles.thumb} src={event.imageUrl} alt="" loading="lazy" />
        ) : (
          <span className={styles.glyph} aria-hidden="true">
            {categoryIcon(event.category)}
          </span>
        )}

        <div className={styles.body}>
          <header className={styles.header}>
            <h3 className={styles.name}>{event.name}</h3>
            <span className={styles.distance}>{formatDistance(event.distance)}</span>
          </header>

          <p className={styles.subtitle}>{event.subtitle}</p>

          {event.startsAt && (
            <p className={styles.when}>
              <strong>{formatRelativeDay(event.startsAt)}</strong>
              <span>
                {formatDate(event.startsAt)}
                {formatTime(event.startsAt) && ` · ${formatTime(event.startsAt)}`}
              </span>
            </p>
          )}

          {event.address && <p className={styles.address}>{event.address}</p>}

          <footer className={styles.footer}>
            <Badge color={color}>{categoryLabel(event.category)}</Badge>
            {event.priceRange && <Badge>{event.priceRange}</Badge>}
            {event.openingHours && (
              // OSM opening-hours strings run long ("Mo-Fr 07:00-18:00; Sa
              // 07:00-15:00"); the full value stays in the tooltip.
              <Badge title={event.openingHours}>
                🕑 {truncate(event.openingHours, 26)}
              </Badge>
            )}
            <span className={styles.spacer} />
            <a
              className={styles.action}
              href={directionsUrl(event.coordinates)}
              target="_blank"
              rel="noreferrer noopener"
              onClick={(clickEvent) => clickEvent.stopPropagation()}
            >
              Directions
            </a>
            {event.url && (
              <a
                className={styles.action}
                href={event.url}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(clickEvent) => clickEvent.stopPropagation()}
                title={event.url}
              >
                {hostnameOf(event.url) || 'Details'} ↗
              </a>
            )}
          </footer>
        </div>
      </article>
    </li>
  );
}
