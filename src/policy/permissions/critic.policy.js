/**
 * @fileoverview critic.policy - Provides critic-policy functionality.
 */
'use strict';

const BasePolicy = require('../BasePolicy');

/**
 * CriticPolicy
 * Manages critic policy logic.
 */
class CriticPolicy extends BasePolicy {
  /**
   * constructor - Executes constructor.
   * @param {*} secondPassCritic - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ secondPassCritic }) {
    super({ name: 'CriticPolicy' });


    this.secondPassCritic = secondPassCritic;
  }

  /**
   * shouldRunCritic - Executes should run critic.
   * @param {*} risk - Input parameter.
   * @param {*} confidence - Input parameter.
   * @param {*} evidenceProvided - Input parameter.
   * @param {*} isReversible - Input parameter.
   * @returns {*} Result of operation.
   */
  shouldRunCritic({ risk = 'LOW', confidence = 0.95, evidenceProvided = true, isReversible = true }) {
    if (risk === 'HIGH' || confidence < 0.8 || !evidenceProvided || !isReversible) {
      return Object.freeze({ shouldRunCritic: true, reason: 'High risk or low confidence/evidence/reversibility' });
    }

    return Object.freeze({ shouldRunCritic: false, reason: 'Low risk with high confidence and evidence' });
  }
}

module.exports = CriticPolicy;
