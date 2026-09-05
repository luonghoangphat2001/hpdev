'use strict';

const OfflineFallbackService = require('@services/workflow/task/offline-fallback.service');

describe('T095: Local/Offline Fallback Service', () => {
  test('executes simple rule deterministic fallback offline', () => {
    const service = new OfflineFallbackService();
    const res = service.executeSimpleRule({ taskType: 'daily_summary', data: { date: '2026-07-25' } });

    expect(res.offlineFallback).toBe(true);
    expect(res.summary).toContain('2026-07-25');
  });
});
