/**
 * Client-side Cache Settings and Route Invalidation Rules.
 */

// Time unit constants (in milliseconds)
export const SECONDS = 1000;
export const MINUTES = 60 * SECONDS;
export const HOURS = 60 * MINUTES;

// Standard TTL presets for consistent duration management
export const TTL_PRESETS = {
  SHORT: 30 * SECONDS,        // 30s: dynamic/frequently changing data (e.g. stats)
  STANDARD: 1 * MINUTES,      // 1m: default general queries
  MEDIUM: 2 * MINUTES,        // 2m: system configs, vocabulary settings
  LONG: 5 * MINUTES,          // 5m: static catalogs, stack definitions
};

export const CACHE_SETTINGS = {
  // Default cache TTL in milliseconds
  DEFAULT_TTL_MS: TTL_PRESETS.STANDARD,

  // Custom TTL overrides for specific route prefixes
  ROUTE_TTLS: {
    '/api/config': TTL_PRESETS.MEDIUM,
    '/api/stats': TTL_PRESETS.SHORT,
    '/api/tech/stacks': TTL_PRESETS.LONG,
    '/api/vocabulary/config': TTL_PRESETS.MEDIUM,
    '/api/learning/config': TTL_PRESETS.MEDIUM,
  },

  // Mutation invalidation mapping (Mutation URL pattern -> query cache prefixes to invalidate)
  MUTATION_RULES: [
    {
      match: /^\/api\/config/,
      invalidate: ['/api/config', '/api/models'],
    },
    {
      match: /^\/api\/vocabulary/,
      invalidate: ['/api/vocabulary'],
    },
    {
      match: /^\/api\/learning/,
      invalidate: ['/api/learning'],
    },
    {
      match: /^\/api\/tech/,
      invalidate: ['/api/tech'],
    },
    {
      match: /^\/api\/study-schedules/,
      invalidate: ['/api/study-schedules'],
    },
    {
      match: /^\/api\/users/,
      invalidate: ['/api/users'],
    },
    {
      match: /^\/api\/logs/,
      invalidate: ['/api/logs'],
    },
    {
      match: /^\/api\/quiz/,
      invalidate: ['/api/quiz'],
    },
    {
      match: /^\/api\/chat/,
      invalidate: ['/api/history', '/api/stats'],
    },
  ],
};
