'use strict';

const { memoryCache, MemoryCache } = require('../../src/cache');

describe('MemoryCache', () => {
  let cache;

  beforeEach(() => {
    cache = new MemoryCache({ cleanupIntervalMs: 0 });
  });

  afterEach(() => {
    cache.destroy();
  });

  test('set and get item correctly', () => {
    cache.set('foo', 'bar', 10);
    expect(cache.get('foo')).toBe('bar');
  });

  test('return null for non-existent key', () => {
    expect(cache.get('non_existent')).toBeNull();
  });

  test('expire item after TTL', async () => {
    cache.set('short_lived', 'temp', 0.05); // 50ms
    expect(cache.get('short_lived')).toBe('temp');

    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(cache.get('short_lived')).toBeNull();
  });

  test('del removes a key', () => {
    cache.set('k1', 'v1');
    expect(cache.del('k1')).toBe(true);
    expect(cache.get('k1')).toBeNull();
  });

  test('delByPrefix removes all matching keys', () => {
    cache.set('models:gemini', ['m1']);
    cache.set('models:claude', ['m2']);
    cache.set('config:export', { app: 'test' });

    const deleted = cache.delByPrefix('models:');
    expect(deleted).toBe(2);
    expect(cache.get('models:gemini')).toBeNull();
    expect(cache.get('models:claude')).toBeNull();
    expect(cache.get('config:export')).toEqual({ app: 'test' });
  });

  test('delByPattern removes keys by RegExp', () => {
    cache.set('test_1', 1);
    cache.set('test_2', 2);
    cache.set('other', 3);

    const deleted = cache.delByPattern(/^test_/);
    expect(deleted).toBe(2);
    expect(cache.get('test_1')).toBeNull();
    expect(cache.get('other')).toBe(3);
  });

  test('flush clears all keys', () => {
    cache.set('k1', 1);
    cache.set('k2', 2);
    cache.flush();
    expect(cache.size).toBe(0);
  });

  test('wrap returns cached value or executes fn and caches', async () => {
    let callCount = 0;
    const fetchFn = async () => {
      callCount++;
      return { result: 'expensive_data' };
    };

    const first = await cache.wrap('expensive_key', 10, fetchFn);
    expect(first).toEqual({ result: 'expensive_data' });
    expect(callCount).toBe(1);

    const second = await cache.wrap('expensive_key', 10, fetchFn);
    expect(second).toEqual({ result: 'expensive_data' });
    expect(callCount).toBe(1); // Not called again!
  });
});
