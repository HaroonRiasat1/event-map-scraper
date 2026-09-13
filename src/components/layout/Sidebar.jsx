import styles from './Sidebar.module.css';

/**
 * The results column. On narrow screens it becomes a bottom sheet that can be
 * collapsed to reveal the map.
 *
 * @param {{ children: React.ReactNode, isExpanded: boolean, onToggle: () => void, count: number }} props
 */
export function Sidebar({ children, isExpanded, onToggle, count }) {
  return (
    <aside className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''}`}>
      <button
        type="button"
        className={styles.handle}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className={styles.grip} aria-hidden="true" />
        <span className={styles.handleLabel}>
          {isExpanded ? 'Show map' : `Show ${count} results`}
        </span>
      </button>

      <div className={styles.content}>{children}</div>
    </aside>
  );
}
