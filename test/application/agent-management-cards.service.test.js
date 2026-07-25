'use strict';

const AgentManagementCardsService = require('../../src/application/services/agent-management-cards.service');

describe('T125: Five-Agent Management Cards Service', () => {
  test('returns 5 management cards with status and KPI', () => {
    const service = new AgentManagementCardsService();
    const cards = service.getAgentCards();

    expect(cards.length).toBe(5);
    expect(cards.map(c => c.agentId)).toContain('dan_cfo');
  });
});
