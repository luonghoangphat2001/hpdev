'use strict';

const { CacheConfig } = require('../../src/cache');

describe('CacheConfig', () => {
  test('defines numeric TTLs for models, config, stats', () => {
    expect(typeof CacheConfig.TTL.MODELS).toBe('number');
    expect(typeof CacheConfig.TTL.CONFIG).toBe('number');
    expect(typeof CacheConfig.TTL.STATS).toBe('number');
    expect(CacheConfig.TTL.MODELS).toBe(600);
    expect(CacheConfig.TTL.CONFIG).toBe(60);
    expect(CacheConfig.TTL.STATS).toBe(30);
  });

  test('provides time helper constants and presets', () => {
    expect(CacheConfig.TIME.SECONDS).toBe(1);
    expect(CacheConfig.TIME.MINUTES).toBe(60);
    expect(CacheConfig.TIME.HOURS).toBe(3600);

    expect(CacheConfig.PRESETS.SHORT).toBe(30);
    expect(CacheConfig.PRESETS.STANDARD).toBe(60);
    expect(CacheConfig.PRESETS.MEDIUM).toBe(120);
    expect(CacheConfig.PRESETS.LONG).toBe(600);
  });

  test('generates cache keys correctly', () => {
    expect(CacheConfig.KEYS.models('gemini')).toBe('models:gemini');
    expect(CacheConfig.KEYS.configExport()).toBe('config:export');
    expect(CacheConfig.KEYS.statsSummary()).toBe('stats:summary');
  });

  test('defines expected prefix constants', () => {
    expect(CacheConfig.PREFIXES.MODELS).toBe('models:');
    expect(CacheConfig.PREFIXES.CONFIG).toBe('config:');
    expect(CacheConfig.PREFIXES.STATS).toBe('stats:');
  });
});
