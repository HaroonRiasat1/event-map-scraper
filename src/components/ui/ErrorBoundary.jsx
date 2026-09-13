import { Component } from 'react';
import { createLogger } from '../../utils/logger.js';
import styles from './ErrorBoundary.module.css';

const log = createLogger('error-boundary');

/**
 * Last line of defence: a render error in the tree shows a recoverable screen
 * instead of a blank page.
 */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    log.error('render failed', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className={styles.fallback} role="alert">
        <span className={styles.icon} aria-hidden="true">
          💥
        </span>
        <h1 className={styles.title}>Something broke</h1>
        <p className={styles.message}>{error.message}</p>
        <button
          type="button"
          className={styles.button}
          onClick={() => window.location.reload()}
        >
          Reload the app
        </button>
      </div>
    );
  }
}
