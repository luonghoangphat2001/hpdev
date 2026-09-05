'use strict';

const CskhAgent = require('@services/ai/agents/cskh.agent');

describe('dan_cskh', () => {
  function setup(feedback) {
    const readAdapter = {
      listCustomerFeedback: jest.fn().mockResolvedValue({ data: [feedback] }),
    };
    const writeAdapter = {
      sendCustomerResponse: jest.fn().mockResolvedValue({ status: 'completed' }),
      issueVoucher: jest.fn().mockResolvedValue({ status: 'completed' }),
    };
    return {
      writeAdapter,
      agent: new CskhAgent({
        readAdapter,
        writeAdapter,
        idFactory: { createId: () => 'prp_1' },
        clock: () => new Date('2026-07-25T00:00:00.000Z'),
      }),
    };
  }

  const severeFeedback = {
    id: 7,
    customer_name: 'An',
    rating: 1,
    sentiment: 'negative',
  };

  it('creates response and voucher proposals for severe feedback without sending', async () => {
    const fixture = setup(severeFeedback);
    await expect(fixture.agent.execute({
      workflowId: 'wf_1',
      feedbackId: 7,
      customerId: 9,
      voucherCode: 'SORRY50',
      voucherExpiry: '2026-08-25T00:00:00.000Z',
    })).resolves.toMatchObject({
      proposal: {
        agent_id: 'dan_cskh',
        proposal_type: 'customer_recovery',
        status: 'proposed',
        requested_actions: [
          { action: 'cskh.response.send' },
          {
            action: 'cskh.voucher.issue',
            payload: { amount: 50000, confidence: 0.95 },
          },
        ],
      },
      receipts: {},
    });
    expect(fixture.writeAdapter.sendCustomerResponse).not.toHaveBeenCalled();
    expect(fixture.writeAdapter.issueVoucher).not.toHaveBeenCalled();
  });

  it('executes only through guarded adapters with supplied approval contexts', async () => {
    const fixture = setup(severeFeedback);
    const responseAction = {
      actionId: 'act_response',
      idempotencyKey: 'idem_response',
      grantedPermissions: ['cskh_response.send'],
    };
    const voucherAction = {
      actionId: 'act_voucher',
      idempotencyKey: 'idem_voucher',
      grantedPermissions: ['voucher.issue'],
      approval: { status: 'consumed', action_id: 'act_voucher' },
    };

    await fixture.agent.execute({
      workflowId: 'wf_1',
      feedbackId: 7,
      customerId: 9,
      voucherCode: 'SORRY50',
      voucherExpiry: '2026-08-25T00:00:00.000Z',
      executeResponse: true,
      executeVoucher: true,
      responseAction,
      voucherAction,
    });
    expect(fixture.writeAdapter.sendCustomerResponse)
      .toHaveBeenCalledWith(expect.any(Object), responseAction);
    expect(fixture.writeAdapter.issueVoucher)
      .toHaveBeenCalledWith(expect.any(Object), voucherAction);
  });

  it('does not propose a voucher for positive feedback', async () => {
    const fixture = setup({
      id: 8,
      customer_name: 'Bình',
      rating: 5,
      sentiment: 'positive',
    });

    const result = await fixture.agent.execute({
      workflowId: 'wf_1',
      feedbackId: 8,
    });
    expect(result.proposal.requested_actions).toHaveLength(1);
    expect(result.proposal.requested_actions[0].action).toBe('cskh.response.send');
  });

  it('rejects voucher execution when recovery policy does not justify it', async () => {
    const fixture = setup({
      id: 8,
      rating: 5,
      sentiment: 'positive',
    });
    await expect(fixture.agent.execute({
      workflowId: 'wf_1',
      feedbackId: 8,
      executeVoucher: true,
    })).rejects.toMatchObject({ code: 'voucher_not_justified' });
    expect(fixture.writeAdapter.issueVoucher).not.toHaveBeenCalled();
  });
});
