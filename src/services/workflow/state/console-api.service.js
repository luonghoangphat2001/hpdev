/**
 * @fileoverview console-api.service - Provides console-api functionality.
 */
'use strict';

/**
 * ConsoleApiService
 * Manages console api logic.
 */
class ConsoleApiService {
  /**
   * constructor - Executes constructor.
   * @param {*} deadLetterRepository - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ deadLetterRepository }) {
    this.deadLetterRepository = deadLetterRepository;
  }

  /**
   * listPendingActions - Asynchronously executes list pending actions.
   * @returns {*} Promise resolving result.
   */
  async listPendingActions() {
    if (this.deadLetterRepository && typeof this.deadLetterRepository.listDeadLetters === 'function') {
      return await this.deadLetterRepository.listDeadLetters();
    }
    return [];
  }

  /**
   * resolvePendingAction - Asynchronously executes resolve pending action.
   * @param {*} actionId - Input parameter.
   * @param {*} decision - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async resolvePendingAction(actionId, decision) {
    return Object.freeze({
      actionId,
      decision,
      resolvedAt: new Date().toISOString(),
      status: 'RESOLVED',
    });
  }
}

module.exports = ConsoleApiService;
