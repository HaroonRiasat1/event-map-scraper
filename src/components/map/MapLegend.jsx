import { CATEGORIES } from '../../constants/categories.js';
import styles from './MapLegend.module.css';

/**
 * Colour key for the markers. Only categories present in the current result set
 * are listed, so the legend stays short.
 *
 * @param {{ counts: Record<string, number> }} props
 */
export function MapLegend({ counts }) {
  const present = CATEGORIES.filter((category) => counts[category.id] > 0);
  if (!present.length) return null;

  return (
    <div className={styles.legend}>
      <p className={styles.title}>Legend</p>
      <ul>
        {present.map((category) => (
          <li key={category.id} className={styles.row}>
            <span className={styles.swatch} style={{ background: category.color }} />
            <span className={styles.label}>{category.label}</span>
            <span className={styles.count}>{counts[category.id]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
