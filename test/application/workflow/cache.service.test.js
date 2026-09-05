'use strict';

const ContextCacheService = require('@services/workflow/state/context-cache.service');

describe('T180: Version-Aware Context/Result Cache Service', () => {
  test('manages version-aware PII-safe cache entries and handles invalidation', () => {
    const service = new ContextCacheService();
    const key = service.generateCacheKey({ resourceId: 'res_99', version: 'v1.2' });
    expect(key).toContain('res_99_v1.2');

    service.set({ key, value: { result: 'OK' } });
    const cached = service.get({ key });
    expect(cached.value.result).toBe('OK');
    expect(cached.piiSafe).toBe(true);

    const inv = service.invalidate({ key });
    expect(inv.invalidated).toBe(true);
    expect(service.get({ key })).toBeNull();
  });
});
