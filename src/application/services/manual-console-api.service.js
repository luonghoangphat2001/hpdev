'use strict';

class ManualConsoleApiService {
  constructor({ deadLetterRepository }) {
    this.deadLetterRepository = deadLetterRepository;
  }

  async listPendingActions() {
    if (this.deadLetterRepository && typeof this.deadLetterRepository.listDeadLetters === 'function') {
      return await this.deadLetterRepository.listDeadLetters();
    }
    return [];
  }

  async resolvePendingAction(actionId, decision) {
    return Object.freeze({
      actionId,
      decision,
      resolvedAt: new Date().toISOString(),
      status: 'RESOLVED',
    });
  }
}

module.exports = ManualConsoleApiService;
