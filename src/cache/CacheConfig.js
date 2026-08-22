'use strict';

/**
 * Time unit constants in seconds.
 */
const SECONDS = 1;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;

/**
 * Standard TTL presets (in seconds).
 */
const TTL_PRESETS = {
  SHORT: 30 * SECONDS,       // 30s
  STANDARD: 1 * MINUTES,     // 1m
  MEDIUM: 2 * MINUTES,       // 2m
  LONG: 10 * MINUTES,        // 10m
};

/**
 * Centralized Server-Side Cache Configuration.
 * Makes it effortless to tune TTLs, manage cache keys, and handle cache invalidation prefixes.
 */
const CacheConfig = {
  // Time unit helpers (in seconds)
  TIME: {
    SECONDS,
    MINUTES,
    HOURS,
  },

  // Standard TTL presets
  PRESETS: TTL_PRESETS,

  // Time-to-live durations in seconds
  TTL: {
    MODELS: TTL_PRESETS.LONG,     // 10 minutes for AI provider model listings
    CONFIG: TTL_PRESETS.STANDARD, // 1 minute for system config
    STATS: TTL_PRESETS.SHORT,     // 30 seconds for analytics & message stats
    DEFAULT: TTL_PRESETS.STANDARD,// default fallback TTL
  },

  // Standardized cache key generators
  KEYS: {
    models: (provider) => `models:${provider}`,
    configExport: () => 'config:export',
    statsSummary: () => 'stats:summary',
  },

  // Cache invalidation prefix groups
  PREFIXES: {
    MODELS: 'models:',
    CONFIG: 'config:',
    STATS: 'stats:',
  },
};

module.exports = CacheConfig;
