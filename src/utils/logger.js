/**
 * Namespaced logger.
 *
 * Debug output is silenced in production builds so the console stays useful;
 * warnings and errors always get through.
 */

const isDev = import.meta.env.DEV;

const stamp = (namespace) => `%c${namespace}`;
const style = 'color:#38bdf8;font-weight:600';

/**
 * @param {string} namespace e.g. 'api:overpass'
 */
export function createLogger(namespace) {
  return {
    debug: (...args) => {
      if (isDev) console.debug(stamp(namespace), style, ...args);
    },
    info: (...args) => {
      if (isDev) console.info(stamp(namespace), style, ...args);
    },
    warn: (...args) => console.warn(stamp(namespace), style, ...args),
    error: (...args) => console.error(stamp(namespace), style, ...args),
  };
}
