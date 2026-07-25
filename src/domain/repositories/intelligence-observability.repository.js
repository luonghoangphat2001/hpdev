'use strict';

class IntelligenceObservabilityRepository {
  async appendTrace(_span) {
    throw new Error('IntelligenceObservabilityRepository.appendTrace must be implemented');
  }

  async findPendingFeedback(_limit) {
    throw new Error('IntelligenceObservabilityRepository.findPendingFeedback must be implemented');
  }
}

module.exports = IntelligenceObservabilityRepository;
