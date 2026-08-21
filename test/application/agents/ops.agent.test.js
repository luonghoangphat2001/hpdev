'use strict';

const OpsAgent = require('../../../src/services/ai/agents/ops.agent');

describe('dan_ops', () => {
  function setup(order) {
    const readAdapter = {
      getOrder: jest.fn().mockResolvedValue({ data: order }),
    };
    const writeAdapter = {
      updateOrderStatus: jest.fn().mockResolvedValue({ status: 'completed' }),
    };
    return {
      writeAdapter,
      agent: new OpsAgent({
        readAdapter,
        writeAdapter,
        idFactory: { createId: () => 'prp_1' },
        clock: () => new Date('2026-07-25T01:00:00.000Z'),
      }),
    };
  }

  it('raises an SLA proposal for delayed orders', async () => {
    const fixture = setup({
      id: 1,
      status: 'processing',
      updated_at: '2026-07-25T00:00:00.000Z',
      resource_version: 'v3',
    });

    await expect(fixture.agent.execute({
      workflowId: 'wf_1',
      orderId: 1,
    })).resolves.toMatchObject({
      proposal: {
        agent_id: 'dan_ops',
        summary: 'Đơn 1 vượt SLA 30 phút',
        evidence: [{
          overdue: true,
          elapsed_minutes: 60,
          threshold_minutes: 30,
        }],
      },
      receipt: null,
    });
  });

  it('rejects status transitions outside the deterministic allowlist', async () => {
    const fixture = setup({
      id: 1,
      status: 'pending',
      updated_at: '2026-07-25T00:59:00.000Z',
    });

    await expect(fixture.agent.execute({
      workflowId: 'wf_1',
      orderId: 1,
      targetStatus: 'completed',
      executeStatusChange: true,
    })).rejects.toMatchObject({ code: 'order_status_transition_invalid' });
    expect(fixture.writeAdapter.updateOrderStatus).not.toHaveBeenCalled();
  });

  it('executes an allowed transition only through the guarded adapter', async () => {
    const fixture = setup({
      id: 1,
      status: 'processing',
      updated_at: '2026-07-25T00:50:00.000Z',
      resource_version: 'v3',
    });

    await expect(fixture.agent.execute({
      workflowId: 'wf_1',
      orderId: 1,
      targetStatus: 'delivering',
      executeStatusChange: true,
      reason: 'Ready for delivery',
      actionId: 'act_1',
      idempotencyKey: 'idem_1',
      grantedPermissions: ['order_status.update'],
    })).resolves.toMatchObject({
      receipt: { status: 'completed' },
    });
    expect(fixture.writeAdapter.updateOrderStatus).toHaveBeenCalledWith(
      {
        order_id: 1,
        target_status: 'delivering',
        reason: 'Ready for delivery',
      },
      expect.objectContaining({
        actionId: 'act_1',
        expectedResourceVersion: 'v3',
      }),
    );
  });
});
