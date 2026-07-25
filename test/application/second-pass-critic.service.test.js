'use strict';

const SecondPassCriticService = require('../../src/application/services/second-pass-critic.service');

describe('T082: Second-Pass Critic Service', () => {
  test('skips review for LOW risk proposal', async () => {
    const critic = new SecondPassCriticService();
    const res = await critic.reviewProposal({ proposal: {}, riskLevel: 'LOW' });
    expect(res.approvedByCritic).toBe(true);
  });

  test('validates HIGH risk proposal with actions', async () => {
    const critic = new SecondPassCriticService();
    const res = await critic.reviewProposal({
      proposal: { proposed_actions: [{ action: 'refund' }] },
      riskLevel: 'HIGH',
    });

    expect(res.approvedByCritic).toBe(true);
  });

  test('rejects HIGH risk proposal without actions', async () => {
    const critic = new SecondPassCriticService();
    const res = await critic.reviewProposal({
      proposal: { proposed_actions: [] },
      riskLevel: 'HIGH',
    });

    expect(res.approvedByCritic).toBe(false);
  });
});
