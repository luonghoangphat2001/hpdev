import { CACHE_SETTINGS, TTL_PRESETS, SECONDS, MINUTES, HOURS } from './config.js';
import { ApiCacheManager } from './apiCache.js';

export {
  SECONDS,
  MINUTES,
  HOURS,
  TTL_PRESETS,
  CACHE_SETTINGS,
  ApiCacheManager,
};

// Global default client-side API cache instance
export const apiCache = new ApiCacheManager(CACHE_SETTINGS);

export function invalidateApiCache(pattern) {
  apiCache.invalidate(pattern);
}

export function clearApiCache(prefix) {
  apiCache.invalidate(prefix);
}
