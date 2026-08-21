/**
 * @fileoverview memory-loop.service - Provides memory-loop functionality.
 */
'use strict';

/**
 * MemoryLoopService
 * Manages memory loop logic.
 */
class MemoryLoopService {
  /**
   * constructor - Executes constructor.
   * @param {*} curatedMemoryStore - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ curatedMemoryStore }) {
    this.curatedMemoryStore = curatedMemoryStore;
  }

  /**
   * reviewAndActivateMemory - Executes review and activate memory.
   * @param {*} candidateId - Input parameter.
   * @param {*} approvedByCeo - Input parameter.
   * @returns {*} Result of operation.
   */
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

  /**
   * expireOrRollbackMemory - Executes expire or rollback memory.
   * @param {*} memoryId - Input parameter.
   * @param {*} reason - Input parameter.
   * @returns {*} Result of operation.
   */
  expireOrRollbackMemory({ memoryId, reason }) {
    return Object.freeze({
      memoryId,
      status: 'EXPIRED_OR_ROLLED_BACK',
      reason,
      deactivatedAt: new Date().toISOString(),
    });
  }
}

module.exports = MemoryLoopService;
