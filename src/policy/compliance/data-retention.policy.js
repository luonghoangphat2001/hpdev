/**
 * @fileoverview data-retention.policy - Provides data-retention functionality.
 */
'use strict';

const BasePolicy = require('../BasePolicy');

/**
 * DataRetentionPolicy
 * Manages data retention logic.
 */
class DataRetentionPolicy extends BasePolicy {
  /**
   * constructor - Executes constructor.
   * @param {*} retentionDays - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ retentionDays = 30 } = {}) {
    super({ name: 'DataRetentionPolicy' });


    this.retentionDays = retentionDays;
  }

  /**
   * isExpired - Executes is expired.
   * @param {*} createdAt - Input parameter.
   * @returns {*} Result of operation.
   */
  isExpired(createdAt) {
    const created = new Date(createdAt).getTime();
    const cutoff = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);
    return created < cutoff;
  }
}

module.exports = DataRetentionPolicy;
