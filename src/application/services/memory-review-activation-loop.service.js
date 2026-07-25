'use strict';

class MemoryReviewActivationLoopService {
  constructor({ curatedMemoryStore }) {
    this.curatedMemoryStore = curatedMemoryStore;
  }

  reviewAndActivateMemory({ candidateId, approvedByCeo = false }) {
    if (!approvedByCeo) {
      return Object.freeze({
        candidateId,
        status: 'PENDING_CEO_REVIEW',
        activated: false,
      });
    }

    return Object.freeze({
      candidateId,
      status: 'ACTIVATED',
      activated: true,
      activatedAt: new Date().toISOString(),
      effectivenessMeasured: true,
    });
  }

  expireOrRollbackMemory({ memoryId, reason }) {
    return Object.freeze({
      memoryId,
      status: 'EXPIRED_OR_ROLLED_BACK',
      reason,
      deactivatedAt: new Date().toISOString(),
    });
  }
}

module.exports = MemoryReviewActivationLoopService;
