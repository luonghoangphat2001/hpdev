/**
 * @fileoverview evidence-validator.policy - Provides evidence-validator functionality.
 */
'use strict';

const BasePolicy = require('@policy/BasePolicy');

/**
 * EvidenceValidatorPolicy
 * Manages evidence logic.
 */
class EvidenceValidatorPolicy extends BasePolicy {
  /**
   * constructor - Executes constructor.
   * @param {*} maxAgeMinutes - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ maxAgeMinutes = 60 } = {}) {
    super({ name: 'EvidenceValidatorPolicy' });


    this.maxAgeMinutes = maxAgeMinutes;
  }

  /**
   * validateEvidence - Executes validate evidence.
   * @param {*} evidenceRefs - Input parameter.
   * @param {*} sourceTimestamps - Input parameter.
   * @returns {*} Result of operation.
   */
  validateEvidence({ evidenceRefs = [], sourceTimestamps = {} }) {
    if (evidenceRefs.length === 0) {
      return Object.freeze({
        isValid: false,
        reason: 'NO_EVIDENCE_PROVIDED',
      });
    }

    const now = Date.now();
    for (const ref of evidenceRefs) {
      const ts = sourceTimestamps[ref];
      if (!ts) {
        return Object.freeze({
          isValid: false,
          reason: `MISSING_TIMESTAMP_FOR_SOURCE:${ref}`,
        });
      }

      const ageMinutes = (now - new Date(ts).getTime()) / (1000 * 60);
      if (ageMinutes > this.maxAgeMinutes) {
        return Object.freeze({
          isValid: false,
          reason: `STALE_SOURCE:${ref}`,
          ageMinutes,
        });
      }
    }

    return Object.freeze({
      isValid: true,
      reason: null,
    });
  }
}

module.exports = EvidenceValidatorPolicy;
