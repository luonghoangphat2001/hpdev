'use strict';

class DeadlineEarlyExitFallbackService {
  constructor({ budgetEnforcerService }) {
    this.budgetEnforcerService = budgetEnforcerService;
  }

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

module.exports = DeadlineEarlyExitFallbackService;
