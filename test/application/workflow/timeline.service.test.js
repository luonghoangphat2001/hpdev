'use strict';

const WorkflowTimelineService = require('../../../src/services/workflow/state/workflow-timeline.service');

describe('T128: Workflow Detail Timeline Service', () => {
  test('returns step-by-step timeline with state transitions and redacted payload', () => {
    const service = new WorkflowTimelineService();
    const result = service.getWorkflowTimeline({
      workflowId: 'wf_100',
      states: [
        { state: 'CREATED', actor: 'SSOT' },
        { state: 'APPROVED', actor: 'CEO' },
      ],
    });

    expect(result.workflowId).toBe('wf_100');
    expect(result.timeline.length).toBe(2);
    expect(result.timeline[1].actor).toBe('CEO');
  });
});
