'use strict';

class VersionAwareContextResultCacheService {
  constructor() {
    this.cache = new Map();
  }

  generateCacheKey({ tenantId = 'dan_tenant', resourceId, version = 'v1.0', policyHash = 'p123', model = 'gemini-3.6-flash' }) {
    return `cache_${tenantId}_${resourceId}_${version}_${policyHash}_${model}`;
  }

  get({ key }) {
    return Object.freeze(this.cache.get(key) || null);
  }

  set({ key, value }) {
    const entry = Object.freeze({
      value,
      piiSafe: true,
      cachedAt: new Date().toISOString(),
    });
    this.cache.set(key, entry);
    return entry;
  }

  invalidate({ key }) {
    return Object.freeze({ invalidated: this.cache.delete(key) });
  }
}

module.exports = VersionAwareContextResultCacheService;
