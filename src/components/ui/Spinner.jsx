import styles from './Spinner.module.css';

/**
 * Indeterminate loading indicator.
 *
 * @param {{ size?: 'sm' | 'md', label?: string }} props
 */
export function Spinner({ size = 'md', label = 'Loading' }) {
  return (
    <span className={`${styles.spinner} ${styles[size]}`} role="status" aria-label={label} />
  );
}
