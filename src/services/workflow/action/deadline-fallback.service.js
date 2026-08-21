/**
 * @fileoverview deadline-fallback.service - Provides deadline-fallback functionality.
 */
'use strict';

/**
 * DeadlineFallbackService
 * Manages deadline fallback logic.
 */
class DeadlineFallbackService {
  /**
   * constructor - Executes constructor.
   * @param {*} budgetEnforcerService - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ budgetEnforcerService }) {
    this.budgetEnforcerService = budgetEnforcerService;
  }

  /**
   * handleExecutionDeadline - Executes handle execution deadline.
   * @param {*} elapsedTimeMs - Input parameter.
   * @param {*} deadlineMs - Input parameter.
   * @param {*} partialResults - Input parameter.
   * @returns {*} Result of operation.
   */
  handleExecutionDeadline({ elapsedTimeMs, deadlineMs = 5000, partialResults = {} }) {
    if (elapsedTimeMs >= deadlineMs) {
      return Object.freeze({
        earlyExit: true,
        fallbackToManualReview: true,
        partialResultsPreserved: true,
        partialResults,
        reason: `Deadline of ${deadlineMs}ms exceeded (elapsed ${elapsedTimeMs}ms)`,
        handledAt: new Date().toISOString(),
      });
    }

    return Object.freeze({
      earlyExit: false,
      fallbackToManualReview: false,
      partialResultsPreserved: false,
      handledAt: new Date().toISOString(),
    });
  }
}

module.exports = DeadlineFallbackService;
