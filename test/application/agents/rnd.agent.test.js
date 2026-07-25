'use strict';

const RndAgent = require('../../../src/application/agents/rnd.agent');

describe('dan_rnd', () => {
  it('analyzes menu performance and returns proposal only', async () => {
    const readAdapter = {
      listProducts: jest.fn().mockResolvedValue({
        data: [
          { id: 1, name: 'Món tốt', price: 100000, cost: 50000, sales_count: 50 },
          { id: 2, name: 'Món chậm', price: 100000, cost: 90000, sales_count: 2 },
        ],
      }),
    };
    const agent = new RndAgent({
      readAdapter,
      idFactory: { createId: () => 'prp_1' },
      clock: () => new Date('2026-07-25T00:00:00.000Z'),
    });

    await expect(agent.execute({
      workflowId: 'wf_1',
      query: { page: 1 },
    })).resolves.toMatchObject({
      proposal_id: 'prp_1',
      workflow_id: 'wf_1',
      agent_id: 'dan_rnd',
      proposal_type: 'menu_review',
      status: 'proposed',
      summary: '1/2 sản phẩm cần xem xét',
      requested_actions: [],
      recommendations: [{
        product_id: 2,
        recommendation: 'review_menu_item',
        reasons: ['slow_sales', 'low_margin'],
      }],
    });
    expect(readAdapter.listProducts).toHaveBeenCalledWith({ page: 1 });
  });

  it('does not expose a publish or write dependency', () => {
    const agent = new RndAgent({
      readAdapter: { listProducts: jest.fn() },
    });
    expect(agent).not.toHaveProperty('writeAdapter');
    expect(agent.publish).toBeUndefined();
  });

  it('rejects proposal types outside R&D scope', () => {
    const agent = new RndAgent({
      readAdapter: { listProducts: jest.fn() },
    });
    expect(() => agent.createProposal({
      workflowId: 'wf_1',
      type: 'refund',
      summary: '',
      evidence: [],
      recommendations: [],
    })).toThrow('dan_rnd cannot create proposal type: refund');
  });
});
