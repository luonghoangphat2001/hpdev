'use strict';

const StaleCheckerService = require('../../../src/services/approval/decisions/stale-checker.service');

describe('T192: Bulk Eligibility, Stale, and Atomic Consume Checks Service', () => {
  test('rechecks payload hash and resource version per item, ensuring safe partial results', () => {
    const service = new StaleCheckerService({});
    const res = service.evaluateBulkEligibility({
      items: [
        { id: 'item1', payloadHash: 'hash_123', version: 1 },
        { id: 'item2', payloadHash: 'hash_999', version: 2 },
      ],
      expectedPayloadHash: 'hash_123',
    });

    expect(res.allEligible).toBe(false);
    expect(res.partialResultSafe).toBe(true);
    expect(res.itemResults[0].eligible).toBe(true);
    expect(res.itemResults[1].stale).toBe(true);
  });
});
