'use strict';

class WorkflowDetailTimelineService {
  getWorkflowTimeline({ workflowId, states = [] }) {
    const timeline = states.map(s => Object.freeze({
      state: s.state,
      actor: s.actor || 'SYSTEM',
      timestamp: s.timestamp || new Date().toISOString(),
      redactedInput: s.input || null,
      redactedOutput: s.output || null,
    }));

    return Object.freeze({
      workflowId,
      timeline: Object.freeze(timeline),
      retrievedAt: new Date().toISOString(),
    });
  }
}

module.exports = WorkflowDetailTimelineService;
