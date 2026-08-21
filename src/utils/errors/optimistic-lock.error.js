/**
 * @fileoverview optimistic-lock.error - Provides optimistic-lock.error functionality.
 */
'use strict';

/**
 * OptimisticLockError
 * Manages optimistic lock error logic.
 */
class OptimisticLockError extends Error {
  /**
   * constructor - Executes constructor.
   * @param {*} entity - Input parameter.
   * @param {*} identifier - Input parameter.
   * @param {*} expectedVersion - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(entity, identifier, expectedVersion) {
    super(`${entity} ${identifier} no longer has version ${expectedVersion}`);
    this.name = 'OptimisticLockError';
    this.code = 'optimistic_lock_conflict';
    this.entity = entity;
    this.identifier = identifier;
    this.expectedVersion = expectedVersion;
  }
}

module.exports = OptimisticLockError;
