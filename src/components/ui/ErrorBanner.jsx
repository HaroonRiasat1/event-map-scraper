import styles from './ErrorBanner.module.css';

/**
 * Inline error with an optional retry action.
 *
 * @param {{ message: string, onRetry?: () => void, tone?: 'error' | 'warning' }} props
 */
export function ErrorBanner({ message, onRetry, tone = 'error' }) {
  if (!message) return null;

  return (
    <div className={`${styles.banner} ${styles[tone]}`} role="alert">
      <span aria-hidden="true">{tone === 'error' ? '⚠️' : 'ℹ️'}</span>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
