import { CACHE_SETTINGS } from './config.js';

function cloneData(data) {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(data);
    } catch {
      // Fallback
    }
  }
  return JSON.parse(JSON.stringify(data));
}

/**
 * In-Memory API Cache Manager with TTL, request collapsing, and pattern invalidation.
 */
export class ApiCacheManager {
  #store = new Map();
  #inflight = new Map();
  #settings;

  constructor(settings = CACHE_SETTINGS) {
    this.#settings = settings;
  }

  /**
   * Resolve appropriate TTL for a given URL.
   * @param {string} url
   * @param {number} [customTtl]
   * @returns {number}
   */
  resolveTtl(url, customTtl) {
    if (typeof customTtl === 'number') {
      return customTtl;
    }

    const cleanUrl = String(url || '').split('?')[0];
    for (const [prefix, ttl] of Object.entries(this.#settings.ROUTE_TTLS || {})) {
      if (cleanUrl.startsWith(prefix)) {
        return ttl;
      }
    }

    return this.#settings.DEFAULT_TTL_MS;
  }

  /**
   * Retrieve cached data if present and unexpired.
   * @param {string} url
   * @returns {any|null}
   */
  get(url) {
    const entry = this.#store.get(url);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt > 0 && Date.now() > entry.expiresAt) {
      this.#store.delete(url);
      return null;
    }

    return cloneData(entry.data);
  }

  /**
   * Set cached data with TTL.
   * @param {string} url
   * @param {any} data
   * @param {number} [ttlMs]
   */
  set(url, data, ttlMs) {
    const ttl = this.resolveTtl(url, ttlMs);
    if (ttl <= 0) return;

    this.#store.set(url, {
      data: cloneData(data),
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Invalidate cache entries by prefix, regex, or flush all.
   * @param {string|RegExp} [pattern]
   */
  invalidate(pattern) {
    if (!pattern) {
      this.#store.clear();
      return;
    }

    for (const key of this.#store.keys()) {
      if (typeof pattern === 'string') {
        if (key.startsWith(pattern)) {
          this.#store.delete(key);
        }
      } else if (pattern instanceof RegExp) {
        if (pattern.test(key)) {
          this.#store.delete(key);
        }
      }
    }
  }

  /**
   * Automatically invalidate caches when a mutation request occurs.
   * @param {string} url
   */
  handleMutation(url) {
    const cleanUrl = String(url || '').split('?')[0];
    let matched = false;

    for (const rule of this.#settings.MUTATION_RULES || []) {
      if (rule.match.test(cleanUrl)) {
        for (const pattern of rule.invalidate) {
          this.invalidate(pattern);
        }
        matched = true;
      }
    }

    // Default fallback invalidation by 2nd path segment (/api/foo/...)
    if (!matched) {
      const segments = cleanUrl.split('/').filter(Boolean);
      if (segments.length >= 2) {
        this.invalidate(`/${segments[0]}/${segments[1]}`);
      } else {
        this.invalidate(cleanUrl);
      }
    }
  }

  /**
   * Fetch data with cache and inflight promise deduplication.
   * @param {string} url
   * @param {{ cache?: boolean, forceRefresh?: boolean, bypassCache?: boolean, ttl?: number }} options
   * @param {() => Promise<any>} fetcher
   * @returns {Promise<any>}
   */
  async wrap(url, options = {}, fetcher) {
    const isCacheEnabled = options.cache !== false && !options.forceRefresh && !options.bypassCache;

    if (isCacheEnabled) {
      const cached = this.get(url);
      if (cached !== null) {
        return cached;
      }

      if (this.#inflight.has(url)) {
        const inflightData = await this.#inflight.get(url);
        return cloneData(inflightData);
      }
    }

    const fetchPromise = (async () => {
      const data = await fetcher();
      if (options.cache !== false) {
        this.set(url, data, options.ttl);
      }
      return data;
    })();

    this.#inflight.set(url, fetchPromise);
    try {
      return await fetchPromise;
    } finally {
      this.#inflight.delete(url);
    }
  }
}
