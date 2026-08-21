'use strict';

const CfoAgent = require('../../../src/services/ai/agents/cfo.agent');

describe('dan_cfo', () => {
  function setup() {
    const readAdapter = {
      getFinanceSummary: jest.fn().mockResolvedValue({
        data: { expected_revenue: 1000000, recorded_revenue: 950000 },
      }),
      getOrder: jest.fn().mockResolvedValue({
        data: { id: 1, total: 500000, refunded_amount: 100000 },
      }),
    };
    const writeAdapter = {
      executeRefund: jest.fn().mockResolvedValue({ status: 'completed' }),
    };
    return {
      readAdapter,
      writeAdapter,
      agent: new CfoAgent({
        readAdapter,
        writeAdapter,
        idFactory: { createId: () => 'prp_1' },
        clock: () => new Date('2026-07-25T00:00:00.000Z'),
      }),
    };
  }

  it('creates a reconciliation proposal without financial mutation', async () => {
    const fixture = setup();
    await expect(fixture.agent.reconcile({
      workflowId: 'wf_1',
      period: 'month',
    })).resolves.toMatchObject({
      agent_id: 'dan_cfo',
      proposal_type: 'reconciliation',
      status: 'proposed',
      summary: 'Chênh lệch đối soát: -50000',
      requested_actions: [],
    });
    expect(fixture.writeAdapter.executeRefund).not.toHaveBeenCalled();
  });

  it('creates a refund proposal without executing by default', async () => {
    const fixture = setup();
    await expect(fixture.agent.refund({
      workflowId: 'wf_1',
      orderId: 1,
      amount: 200000,
      reason: 'Customer request',
    })).resolves.toMatchObject({
      proposal: {
        proposal_type: 'refund',
        requested_actions: [{
          action: 'finance.refund.execute',
          approval_required: true,
        }],
      },
      receipt: null,
    });
    expect(fixture.writeAdapter.executeRefund).not.toHaveBeenCalled();
  });

  it('forwards consumed approval to guarded adapter for real refund', async () => {
    const fixture = setup();
    const approval = { status: 'consumed', action_id: 'act_1' };

    await fixture.agent.refund({
      workflowId: 'wf_1',
      orderId: 1,
      amount: 200000,
      reason: 'Customer request',
      execute: true,
      actionId: 'act_1',
      idempotencyKey: 'idem_1',
      grantedPermissions: ['refund.execute'],
      approval,
    });
    expect(fixture.writeAdapter.executeRefund).toHaveBeenCalledWith(
      { order_id: 1, amount: 200000, reason: 'Customer request' },
      expect.objectContaining({ actionId: 'act_1', approval }),
    );
  });

  it('rejects refund above the remaining refundable amount', async () => {
    const fixture = setup();
    await expect(fixture.agent.refund({
      workflowId: 'wf_1',
      orderId: 1,
      amount: 450000,
      reason: 'Too much',
    })).rejects.toMatchObject({ code: 'refund_amount_invalid' });
    expect(fixture.writeAdapter.executeRefund).not.toHaveBeenCalled();
  });
});
