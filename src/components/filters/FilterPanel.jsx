import { CATEGORIES } from '../../constants/categories.js';
import { RADIUS_OPTIONS_M } from '../../constants/config.js';
import { formatDistance } from '../../utils/geo.js';
import styles from './FilterPanel.module.css';

/**
 * Category chips, radius selector and a text filter over the loaded results.
 *
 * Changing a category or the text is free — it filters what is already in
 * memory. Changing the radius re-runs the search, which is why it is visually
 * separated.
 *
 * @param {{
 *   categories: string[],
 *   counts: Record<string, number>,
 *   radius: number,
 *   query: string,
 *   disabled?: boolean,
 *   onToggleCategory: (id: string) => void,
 *   onClearCategories: () => void,
 *   onRadiusChange: (radius: number) => void,
 *   onQueryChange: (query: string) => void,
 * }} props
 */
export function FilterPanel({
  categories,
  counts,
  radius,
  query,
  disabled = false,
  onToggleCategory,
  onClearCategories,
  onRadiusChange,
  onQueryChange,
}) {
  const available = CATEGORIES.filter((category) => counts[category.id] > 0);

  return (
    <section className={styles.panel} aria-label="Filters">
      <div className={styles.row}>
        <input
          className={styles.search}
          type="search"
          value={query}
          placeholder="Filter results by name…"
          aria-label="Filter results by name"
          disabled={disabled}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <label className={styles.radius}>
          <span className={styles.radiusLabel}>Radius</span>
          <select
            value={radius}
            onChange={(event) => onRadiusChange(Number(event.target.value))}
            disabled={disabled}
          >
            {RADIUS_OPTIONS_M.map((option) => (
              <option key={option} value={option}>
                {formatDistance(option)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {available.length > 0 && (
        <div className={styles.chips} role="group" aria-label="Categories">
          <button
            type="button"
            className={`${styles.chip} ${categories.length === 0 ? styles.active : ''}`}
            onClick={onClearCategories}
          >
            All
          </button>

          {available.map((category) => {
            const isActive = categories.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={isActive}
                className={`${styles.chip} ${isActive ? styles.active : ''}`}
                style={isActive ? { '--chip': category.color } : undefined}
                onClick={() => onToggleCategory(category.id)}
              >
                <span aria-hidden="true">{category.icon}</span>
                {category.label}
                <span className={styles.count}>{counts[category.id]}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
