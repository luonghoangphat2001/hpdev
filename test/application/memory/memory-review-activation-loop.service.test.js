'use strict';

const MemoryReviewActivationLoopService = require('../../../src/application/services/memory/memory-review-activation-loop.service');

describe('T168: Memory Review/Activation/Outcome Loop Service', () => {
  test('activates memory upon CEO approval and handles expiration/rollback', () => {
    const service = new MemoryReviewActivationLoopService({});
    const pending = service.reviewAndActivateMemory({ candidateId: 'cand_1', approvedByCeo: false });
    expect(pending.activated).toBe(false);

    const active = service.reviewAndActivateMemory({ candidateId: 'cand_1', approvedByCeo: true });
    expect(active.activated).toBe(true);
    expect(active.status).toBe('ACTIVATED');

    const rollback = service.expireOrRollbackMemory({ memoryId: 'mem_1', reason: 'Sub-optimal outcome' });
    expect(rollback.status).toBe('EXPIRED_OR_ROLLED_BACK');
  });
});
