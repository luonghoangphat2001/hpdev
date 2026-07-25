'use strict';

class WorkflowActionRepository {
  async findReconciliationCandidates(_before, _limit) {
    throw new Error('WorkflowActionRepository.findReconciliationCandidates must be implemented');
  }

  async markCompleted(_actionId, _receipt, _receiptHash, _completedAt) {
    throw new Error('WorkflowActionRepository.markCompleted must be implemented');
  }

  async markRetryQueued(_actionId) {
    throw new Error('WorkflowActionRepository.markRetryQueued must be implemented');
  }

  async markManualReview(_actionId, _failure) {
    throw new Error('WorkflowActionRepository.markManualReview must be implemented');
  }
}

module.exports = WorkflowActionRepository;
