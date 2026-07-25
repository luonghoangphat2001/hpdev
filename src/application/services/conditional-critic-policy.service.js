'use strict';

class ConditionalCriticPolicyService {
  constructor({ secondPassCritic }) {
    this.secondPassCritic = secondPassCritic;
  }

  shouldRunCritic({ risk = 'LOW', confidence = 0.95, evidenceProvided = true, isReversible = true }) {
    if (risk === 'HIGH' || confidence < 0.8 || !evidenceProvided || !isReversible) {
      return Object.freeze({ shouldRunCritic: true, reason: 'High risk or low confidence/evidence/reversibility' });
    }

    return Object.freeze({ shouldRunCritic: false, reason: 'Low risk with high confidence and evidence' });
  }
}

module.exports = ConditionalCriticPolicyService;
