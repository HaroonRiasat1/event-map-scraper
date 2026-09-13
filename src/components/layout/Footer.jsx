import styles from './Footer.module.css';

/**
 * Attribution strip. Both OpenStreetMap and Open-Meteo require credit, and
 * naming the sources also tells users where the data comes from.
 *
 * @param {{ sources: import('../../services/eventsService.js').SourceStatus[] }} props
 */
export function Footer({ sources }) {
  return (
    <footer className={styles.footer}>
      <span>
        Data ©{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer noopener"
        >
          OpenStreetMap
        </a>{' '}
        contributors · weather by{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer noopener">
          Open-Meteo
        </a>
      </span>

      <span className={styles.status}>
        {sources.map((source) => (
          <span key={source.id} className={styles[source.state]} title={source.message}>
            {source.label}
          </span>
        ))}
      </span>
    </footer>
  );
}
