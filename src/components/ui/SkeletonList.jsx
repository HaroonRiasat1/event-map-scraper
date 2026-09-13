import styles from './SkeletonList.module.css';

/**
 * Loading placeholder shaped like the result list, so the layout does not jump
 * when real cards arrive.
 *
 * @param {{ count?: number }} props
 */
export function SkeletonList({ count = 5 }) {
  return (
    <ul className={styles.list} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className={styles.item}>
          <span className={styles.avatar} />
          <span className={styles.lines}>
            <span className={styles.line} />
            <span className={`${styles.line} ${styles.short}`} />
          </span>
        </li>
      ))}
    </ul>
  );
}
