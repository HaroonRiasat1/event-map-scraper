import styles from './Badge.module.css';

/**
 * Small inline label. `color` tints the background and text together so any
 * category colour stays readable on the dark surface.
 *
 * @param {{ children: React.ReactNode, color?: string, title?: string }} props
 */
export function Badge({ children, color, title }) {
  const style = color
    ? { color, backgroundColor: `${color}1f`, borderColor: `${color}47` }
    : undefined;

  return (
    <span className={styles.badge} style={style} title={title}>
      {children}
    </span>
  );
}
