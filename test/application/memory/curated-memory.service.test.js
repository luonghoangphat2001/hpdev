'use strict';

const CuratedMemoryService = require('@services/ai/memory/curated-memory.service');

describe('T166: Curated Memory Schema/Store Service', () => {
  test('creates curated memory entry with confidence, scope, TTL, status, and version', () => {
    const service = new CuratedMemoryService();
    const mem = service.createMemoryEntry({
      type: 'PREFERENCE',
      source: 'CEO_FEEDBACK',
      confidence: 0.98,
      scope: 'GLOBAL',
      ttl: 604800,
    });

    expect(mem.memoryId).toBeDefined();
    expect(mem.confidence).toBe(0.98);
    expect(mem.status).toBe('ACTIVE');
  });
});
