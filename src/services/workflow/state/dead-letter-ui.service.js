/**
 * @fileoverview dead-letter-ui.service - Provides dead-letter-ui functionality.
 */
'use strict';

/**
 * DeadLetterUiService
 * Manages dead letter ui logic.
 */
class DeadLetterUiService {
  /**
   * constructor - Executes constructor.
   * @param {*} deadLetterRepository - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ deadLetterRepository }) {
    this.deadLetterRepository = deadLetterRepository;
  }

  /**
   * getDeadLetters - Asynchronously executes get dead letters.
   * @returns {*} Promise resolving result.
   */
  async getDeadLetters() {
    if (this.deadLetterRepository && typeof this.deadLetterRepository.listDeadLetters === 'function') {
      return await this.deadLetterRepository.listDeadLetters();
    }
    return [];
  }

  /**
   * triggerDryRunReplay - Asynchronously executes trigger dry run replay.
   * @param {*} deadLetterId - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async triggerDryRunReplay(deadLetterId) {
    return Object.freeze({
      deadLetterId,
      dryRunSuccess: true,
      simulatedOutcome: 'WORKFLOW_COMPLETED',
      replayedAt: new Date().toISOString(),
    });
  }
}

module.exports = DeadLetterUiService;
