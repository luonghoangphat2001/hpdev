'use strict';

class WorkflowRepository {
  async create(_workflow) {
    throw new Error('WorkflowRepository.create must be implemented');
  }

  async findByWorkflowId(_workflowId) {
    throw new Error('WorkflowRepository.findByWorkflowId must be implemented');
  }

  async transition(_workflowId, _expectedVersion, _transition) {
    throw new Error('WorkflowRepository.transition must be implemented');
  }

  async findPortfolioCandidates(_limit) {
    throw new Error('WorkflowRepository.findPortfolioCandidates must be implemented');
  }

  async updatePriority(_workflowId, _expectedVersion, _priority) {
    throw new Error('WorkflowRepository.updatePriority must be implemented');
  }
}

module.exports = WorkflowRepository;
