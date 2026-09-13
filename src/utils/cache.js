/**
 * TTL cache with an in-memory layer and a `sessionStorage` layer.
 *
 * The memory layer keeps a fast path within a session; the storage layer keeps
 * results across reloads, which matters because both Nominatim and Overpass are
 * rate-limited community services and should not be hammered on every refresh.
 * Storage failures (private mode, quota) degrade to memory-only silently.
 */

import { createLogger } from './logger.js';

const log = createLogger('cache');

/** @type {Map<string, { value: unknown, expiresAt: number }>} */
const memory = new Map();

const storageKey = (namespace, key) => `ems:cache:${namespace}:${key}`;

function readStorage(fullKey) {
  try {
    const raw = sessionStorage.getItem(fullKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(fullKey, entry) {
  try {
    sessionStorage.setItem(fullKey, JSON.stringify(entry));
  } catch (error) {
    // Most likely a quota error; drop the oldest cache entries and move on.
    log.debug('sessionStorage write failed, evicting', error);
    evictStorage();
  }
}

function evictStorage() {
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('ems:cache:')) sessionStorage.removeItem(key);
    }
  } catch {
    /* nothing else we can do */
  }
}

/**
 * @template T
 * @param {string} namespace
 * @param {string} key
 * @returns {T | null} the cached value, or null when missing or expired
 */
export function getCached(namespace, key) {
  const fullKey = storageKey(namespace, key);
  const now = Date.now();

  const hit = memory.get(fullKey);
  if (hit) {
    if (hit.expiresAt > now) return hit.value;
    memory.delete(fullKey);
  }

  const stored = readStorage(fullKey);
  if (stored && stored.expiresAt > now) {
    memory.set(fullKey, stored);
    return stored.value;
  }
  return null;
}

/**
 * @param {string} namespace
 * @param {string} key
 * @param {unknown} value
 * @param {number} ttlMs
 */
export function setCached(namespace, key, value, ttlMs) {
  const entry = { value, expiresAt: Date.now() + ttlMs };
  const fullKey = storageKey(namespace, key);
  memory.set(fullKey, entry);
  writeStorage(fullKey, entry);
}

/**
 * Read-through helper: return the cached value or run `factory` and cache it.
 *
 * @template T
 * @param {string} namespace
 * @param {string} key
 * @param {number} ttlMs
 * @param {() => Promise<T>} factory
 * @returns {Promise<T>}
 */
export async function withCache(namespace, key, ttlMs, factory) {
  const cached = getCached(namespace, key);
  if (cached !== null) {
    log.debug('hit', namespace, key);
    return cached;
  }
  const value = await factory();
  setCached(namespace, key, value, ttlMs);
  return value;
}

/** Clear one namespace, or the whole cache when called with no arguments. */
export function clearCache(namespace) {
  const prefix = namespace ? `ems:cache:${namespace}:` : 'ems:cache:';
  for (const key of memory.keys()) if (key.startsWith(prefix)) memory.delete(key);
  try {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith(prefix)) sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
