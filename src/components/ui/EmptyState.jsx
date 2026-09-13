import styles from './EmptyState.module.css';

/**
 * Placeholder shown when a panel has nothing to render.
 *
 * @param {{ icon?: string, title: string, description?: string, action?: React.ReactNode }} props
 */
export function EmptyState({ icon = '🔍', title, description, action }) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  );
}
