import { SearchBar } from '../search/SearchBar.jsx';
import styles from './Header.module.css';

/**
 * App bar: brand, search, and a link back to the source.
 *
 * @param {{
 *   onSelectPlace: (place: import('../../api/nominatim.js').Place) => void,
 *   recent: import('../../api/nominatim.js').Place[],
 *   initialQuery?: string,
 * }} props
 */
export function Header({ onSelectPlace, recent, initialQuery }) {
  return (
    <header className={styles.header}>
      <a className={styles.brand} href="./" aria-label="Event Map Scraper — home">
        <span className={styles.logo} aria-hidden="true">
          🗺️
        </span>
        <span className={styles.brandText}>
          <strong>EventMap</strong>
          <span>Scraper</span>
        </span>
      </a>

      <SearchBar onSelect={onSelectPlace} recent={recent} initialQuery={initialQuery} />

      <a
        className={styles.github}
        href="https://github.com/HaroonRiasat1/event-map-scraper"
        target="_blank"
        rel="noreferrer noopener"
      >
        GitHub ↗
      </a>
    </header>
  );
}
