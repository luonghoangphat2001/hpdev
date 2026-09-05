'use strict';

const { createCrossAgentHandoffDto } = require('@schemas/ai/handoff.dto');

describe('T062: Cross-agent handoff DTO', () => {
  test('creates valid frozen handoff DTO', () => {
    const dto = createCrossAgentHandoffDto({
      handoffId: 'ho_123',
      sourceAgent: 'dan_rnd',
      targetAgent: 'dan_logistics',
      workflowId: 'wf_456',
      contextRefs: ['recipe:rec_1'],
      payload: { recipeId: 'rec_1', ingredients: [{ id: 'ing_1', qty: 50 }] },
      expectedResult: 'verify_material_availability',
      deadlineAt: '2026-07-25T18:00:00.000Z',
    });

    expect(dto.handoffId).toBe('ho_123');
    expect(dto.sourceAgent).toBe('dan_rnd');
    expect(dto.targetAgent).toBe('dan_logistics');
    expect(Object.isFrozen(dto)).toBe(true);
  });

  test('throws error if required field missing', () => {
    expect(() => {
      createCrossAgentHandoffDto({
        handoffId: 'ho_123',
        sourceAgent: 'dan_rnd',
      });
    }).toThrow('Missing required fields for CrossAgentHandoff DTO');
  });
});
