'use strict';

class OptimisticLockError extends Error {
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
