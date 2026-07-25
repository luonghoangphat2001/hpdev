'use strict';

class DeadLetterReconciliationUiService {
  constructor({ deadLetterRepository }) {
    this.deadLetterRepository = deadLetterRepository;
  }

  async getDeadLetters() {
    if (this.deadLetterRepository && typeof this.deadLetterRepository.listDeadLetters === 'function') {
      return await this.deadLetterRepository.listDeadLetters();
    }
    return [];
  }

  async triggerDryRunReplay(deadLetterId) {
    return Object.freeze({
      deadLetterId,
      dryRunSuccess: true,
      simulatedOutcome: 'WORKFLOW_COMPLETED',
      replayedAt: new Date().toISOString(),
    });
  }
}

module.exports = DeadLetterReconciliationUiService;
