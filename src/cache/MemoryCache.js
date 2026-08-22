'use strict';

/**
 * High-performance, in-memory TTL cache utility.
 */
class MemoryCache {
  /** @type {Map<string, { value: any, expiresAt: number }>} */
  #store = new Map();
  #cleanupInterval = null;

  /**
   * @param {{ cleanupIntervalMs?: number }} [options]
   */
  constructor(options = {}) {
    const cleanupIntervalMs = options.cleanupIntervalMs || 60000;
    if (cleanupIntervalMs > 0 && typeof setInterval === 'function') {
      this.#cleanupInterval = setInterval(() => this.#cleanup(), cleanupIntervalMs);
      if (this.#cleanupInterval && typeof this.#cleanupInterval.unref === 'function') {
        this.#cleanupInterval.unref();
      }
    }
  }

  /**
   * Retrieve a value by key. Returns null if not found or expired.
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const entry = this.#store.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.#store.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Store a value with TTL in seconds.
   * @param {string} key
   * @param {any} value
   * @param {number} [ttlSeconds=60]
   */
  set(key, value, ttlSeconds = 60) {
    const expiresAt = ttlSeconds > 0 ? Date.now() + (ttlSeconds * 1000) : 0;
    this.#store.set(key, { value, expiresAt });
  }

  /**
   * Delete a key from cache.
   * @param {string} key
   * @returns {boolean}
   */
  del(key) {
    return this.#store.delete(key);
  }

  /**
   * Delete all keys starting with prefix.
   * @param {string} prefix
   * @returns {number} number of deleted entries
   */
  delByPrefix(prefix) {
    let count = 0;
    for (const key of this.#store.keys()) {
      if (key.startsWith(prefix)) {
        this.#store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Delete all keys matching RegExp pattern.
   * @param {RegExp} pattern
   * @returns {number}
   */
  delByPattern(pattern) {
    let count = 0;
    for (const key of this.#store.keys()) {
      if (pattern.test(key)) {
        this.#store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all cache entries.
   */
  flush() {
    this.#store.clear();
  }

  /**
   * Return number of active entries in cache.
   * @returns {number}
   */
  get size() {
    return this.#store.size;
  }

  /**
   * Fetch from cache if exists and valid, otherwise execute fn, store and return.
   * @template T
   * @param {string} key
   * @param {number} ttlSeconds
   * @param {() => Promise<T>|T} fn
   * @returns {Promise<T>}
   */
  async wrap(key, ttlSeconds, fn) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    if (value !== undefined && value !== null) {
      this.set(key, value, ttlSeconds);
    }
    return value;
  }

  /**
   * Internal purge for expired items.
   * @private
   */
  #cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.#store.entries()) {
      if (entry.expiresAt > 0 && now > entry.expiresAt) {
        this.#store.delete(key);
      }
    }
  }

  /**
   * Stop background timer (useful for clean unit test teardown).
   */
  destroy() {
    if (this.#cleanupInterval) {
      clearInterval(this.#cleanupInterval);
      this.#cleanupInterval = null;
    }
    this.flush();
  }
}

const defaultCache = new MemoryCache();
defaultCache.MemoryCache = MemoryCache;

module.exports = defaultCache;
