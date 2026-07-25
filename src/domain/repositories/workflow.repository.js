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
}

module.exports = WorkflowRepository;
