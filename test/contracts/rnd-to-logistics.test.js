'use strict';

const { createRnDToLogisticsHandoff } = require('@schemas/ai/handoffs/rnd-to-logistics');

describe('T063: R&D -> Logistics Handoff', () => {
  test('creates valid R&D to Logistics handoff', () => {
    const handoff = createRnDToLogisticsHandoff({
      handoffId: 'ho_rnd_log_1',
      workflowId: 'wf_101',
      recipeId: 'rec_coffee_01',
      recipeName: 'Mocha Cold Brew',
      ingredients: [{ id: 'ing_milk', quantity: 0.2 }],
      estimatedDailyVolume: 100,
      deadlineAt: '2026-07-26T00:00:00.000Z',
    });

    expect(handoff.sourceAgent).toBe('dan_rnd');
    expect(handoff.targetAgent).toBe('dan_logistics');
    expect(handoff.payload.materialImpact[0].estimatedDailyNeed).toBe(20);
  });
});
