'use strict';

const DeadlineEarlyExitFallbackService = require('../../src/application/services/deadline-early-exit-fallback.service');

describe('T183: Deadline, Early-Exit, and Manual-Review Fallback Service', () => {
  test('safely early-exits, preserves partial results, and falls back to manual review on deadline breach', () => {
    const service = new DeadlineEarlyExitFallbackService({});
    const safe = service.handleExecutionDeadline({ elapsedTimeMs: 1000, deadlineMs: 5000, partialResults: { step1: 'DONE' } });
    expect(safe.earlyExit).toBe(false);

    const breached = service.handleExecutionDeadline({ elapsedTimeMs: 5500, deadlineMs: 5000, partialResults: { step1: 'DONE' } });
    expect(breached.earlyExit).toBe(true);
    expect(breached.fallbackToManualReview).toBe(true);
    expect(breached.partialResultsPreserved).toBe(true);
  });
});
