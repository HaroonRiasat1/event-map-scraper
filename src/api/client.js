/**
 * The single HTTP entry point for the app.
 *
 * Every outbound request goes through `request()`, which adds timeouts,
 * bounded retries with exponential back-off, abort-signal plumbing and a
 * typed error. Source modules therefore stay focused on shaping URLs and
 * mapping payloads.
 */

import { HTTP } from '../constants/config.js';
import { createLogger } from '../utils/logger.js';

const log = createLogger('api:client');

/** Error thrown for any non-ok response or transport failure. */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, source?: string, cause?: unknown, retryable?: boolean }} [meta]
   */
  constructor(message, meta = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = meta.status ?? 0;
    this.source = meta.source ?? 'unknown';
    this.cause = meta.cause;
    this.retryable = meta.retryable ?? false;
  }
}

/** Aborts are how we cancel superseded searches — they are never errors. */
export const isAbortError = (error) =>
  error?.name === 'AbortError' || error?.code === 20;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 408/429 and 5xx are worth another attempt; 4xx generally are not. */
const isRetryableStatus = (status) =>
  status === 408 || status === 425 || status === 429 || status >= 500;

/**
 * Combine an external abort signal with an internal timeout so whichever fires
 * first cancels the underlying fetch.
 *
 * @param {AbortSignal | undefined} external
 * @param {number} timeoutMs
 */
function withTimeout(external, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  external?.addEventListener('abort', onAbort, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer);
      external?.removeEventListener('abort', onAbort);
    },
    /** True when we cancelled it ourselves rather than the caller cancelling. */
    timedOut: () => !external?.aborted && controller.signal.aborted,
  };
}

/**
 * Perform a JSON request.
 *
 * @param {string} url
 * @param {{
 *   method?: string,
 *   body?: BodyInit,
 *   headers?: Record<string, string>,
 *   signal?: AbortSignal,
 *   timeoutMs?: number,
 *   retries?: number,
 *   source?: string,
 * }} [options]
 * @returns {Promise<any>} the parsed JSON body
 * @throws {ApiError}
 */
export async function request(url, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    signal,
    timeoutMs = HTTP.timeoutMs,
    retries = HTTP.retries,
    source = 'unknown',
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    // A fresh timeout budget per attempt.
    const guard = withTimeout(signal, timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        body,
        headers: { Accept: 'application/json', ...headers },
        signal: guard.signal,
        // These services are public and must never receive our cookies.
        credentials: 'omit',
        referrerPolicy: 'strict-origin-when-cross-origin',
      });

      if (!response.ok) {
        throw new ApiError(
          `${source}: HTTP ${response.status} ${response.statusText}`.trim(),
          { status: response.status, source, retryable: isRetryableStatus(response.status) },
        );
      }

      return await response.json();
    } catch (error) {
      // The caller cancelled: propagate immediately, never retry.
      if (isAbortError(error) && !guard.timedOut()) throw error;

      lastError =
        error instanceof ApiError
          ? error
          : new ApiError(
              guard.timedOut()
                ? `${source}: request timed out after ${timeoutMs} ms`
                : `${source}: network request failed`,
              { source, cause: error, retryable: true },
            );

      const canRetry = lastError.retryable && attempt < retries;
      log.debug(`attempt ${attempt + 1} failed`, lastError.message, { canRetry });
      if (!canRetry) break;

      // Exponential back-off with jitter, so parallel sources do not sync up.
      const delay = HTTP.retryBaseDelayMs * 2 ** attempt + Math.random() * 250;
      await sleep(delay);
    } finally {
      guard.cleanup();
    }
  }

  throw lastError;
}

/**
 * Serialise calls to a host that limits request rate (Nominatim allows one
 * request per second). Returns a wrapper that queues invocations.
 *
 * @template {(...args: any[]) => Promise<any>} F
 * @param {F} fn
 * @param {number} minIntervalMs
 * @returns {F}
 */
export function rateLimit(fn, minIntervalMs) {
  let chain = Promise.resolve();
  let lastCall = 0;

  return function rateLimited(...args) {
    const run = async () => {
      const wait = minIntervalMs - (Date.now() - lastCall);
      if (wait > 0) await sleep(wait);
      lastCall = Date.now();
      return fn(...args);
    };
    // Keep the queue alive even when a call rejects.
    const result = chain.then(run, run);
    chain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}
