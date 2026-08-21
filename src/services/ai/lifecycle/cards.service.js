/**
 * @fileoverview cards.service - Provides cards functionality.
 */
'use strict';

/**
 * CardsService
 * Manages cards logic.
 */
class CardsService {
  /**
   * getAgentCards - Executes get agent cards.
   * @returns {*} Result of operation.
   */
  getAgentCards() {
    const agents = ['dan_ops', 'dan_cfo', 'dan_cskh', 'dan_logistics', 'dan_rnd'];
    const cards = agents.map(agentId => Object.freeze({
      agentId,
      status: 'ACTIVE',
      currentTask: 'Idle / Monitoring',
      queueLength: 0,
      kpiScore: 98.5,
      costTodayUSD: 0.05,
      activeModel: 'gemini-3.6-flash',
    }));

    return Object.freeze(cards);
  }
}

module.exports = CardsService;
