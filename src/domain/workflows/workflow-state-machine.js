'use strict';

const TRANSITIONS = Object.freeze({
  received: Object.freeze(['queued', 'failed', 'cancelled']),
  queued: Object.freeze(['running', 'failed', 'cancelled']),
  running: Object.freeze(['awaiting_approval', 'completed', 'failed', 'cancelled']),
  awaiting_approval: Object.freeze(['running', 'failed', 'cancelled']),
  completed: Object.freeze([]),
  failed: Object.freeze(['queued', 'cancelled']),
  cancelled: Object.freeze([]),
});

class InvalidWorkflowTransitionError extends Error {
  constructor(from, to) {
    super(`Workflow transition is not allowed: ${from} -> ${to}`);
    this.name = 'InvalidWorkflowTransitionError';
    this.code = 'invalid_workflow_transition';
    this.from = from;
    this.to = to;
  }
}

class WorkflowStateMachine {
  canTransition(from, to) {
    return TRANSITIONS[from]?.includes(to) === true;
  }

  assertTransition(from, to) {
    if (!this.canTransition(from, to)) {
      throw new InvalidWorkflowTransitionError(from, to);
    }
  }

  isTerminal(state) {
    return Array.isArray(TRANSITIONS[state]) && TRANSITIONS[state].length === 0;
  }
}

module.exports = new WorkflowStateMachine();
module.exports.WorkflowStateMachine = WorkflowStateMachine;
module.exports.InvalidWorkflowTransitionError = InvalidWorkflowTransitionError;
module.exports.TRANSITIONS = TRANSITIONS;
