'use strict';

const { createCskhToRndOpsFeedbackHandoff } = require('../../src/contracts/handoffs/cskh-to-rnd-ops.handoff');

describe('T066: CSKH -> R&D/Ops Feedback Handoff', () => {
  test('creates valid CSKH to R&D feedback handoff', () => {
    const handoff = createCskhToRndOpsFeedbackHandoff({
      handoffId: 'ho_cskh_rnd_1',
      workflowId: 'wf_104',
      targetAgent: 'dan_rnd',
      complaintCategory: 'sour_milk_tea',
      complaintCount: 5,
      details: 'Multiple complaints about sour milk tea',
      deadlineAt: '2026-07-26T00:00:00.000Z',
    });

    expect(handoff.sourceAgent).toBe('dan_cskh');
    expect(handoff.targetAgent).toBe('dan_rnd');
    expect(handoff.payload.feedbackProposal.action).toBe('adjust_recipe_quality');
  });

  test('throws if invalid targetAgent', () => {
    expect(() => {
      createCskhToRndOpsFeedbackHandoff({
        handoffId: 'ho_1',
        workflowId: 'wf_1',
        targetAgent: 'dan_cfo',
        complaintCategory: 'cat',
        deadlineAt: '2026-07-26T00:00:00.000Z',
      });
    }).toThrow('targetAgent must be either dan_rnd or dan_ops');
  });
});
