'use strict';

const LogisticsAgent = require('../../../src/application/agents/logistics.agent');

describe('dan_logistics', () => {
  function createAgent(inventory, receipt = { status: 'completed' }) {
    const readAdapter = {
      getInventory: jest.fn().mockImplementation(async (productId) => ({
        data: inventory[productId],
      })),
    };
    const writeAdapter = {
      createPurchaseOrderDraft: jest.fn().mockResolvedValue(receipt),
    };
    return {
      readAdapter,
      writeAdapter,
      agent: new LogisticsAgent({
        readAdapter,
        writeAdapter,
        idFactory: { createId: () => 'prp_1' },
        clock: () => new Date('2026-07-25T00:00:00.000Z'),
      }),
    };
  }

  it('creates a policy-guarded purchase-order draft from real shortages', async () => {
    const fixture = createAgent({
      1: { product_id: 1, qty: 2, security_stock: 10, unit_cost: 20000 },
      2: { product_id: 2, qty: 20, security_stock: 10, unit_cost: 30000 },
    });

    await expect(fixture.agent.execute({
      workflowId: 'wf_1',
      productIds: [1, 2],
      supplierName: 'Supplier A',
      expectedDeliveryDate: '2026-08-01',
      actionId: 'act_1',
      idempotencyKey: 'idem_1',
      grantedPermissions: ['purchase_order_draft.create'],
    })).resolves.toMatchObject({
      proposal: {
        agent_id: 'dan_logistics',
        proposal_type: 'purchase_order_draft',
        summary: '1 sản phẩm cần bổ sung tồn kho',
        recommendations: [{ product_id: 1, reorder_quantity: 8 }],
      },
      receipt: { status: 'completed' },
    });
    expect(fixture.writeAdapter.createPurchaseOrderDraft).toHaveBeenCalledWith(
      {
        supplier_name: 'Supplier A',
        total_amount: 160000,
        expected_delivery_date: '2026-08-01',
      },
      expect.objectContaining({
        actionId: 'act_1',
        grantedPermissions: ['purchase_order_draft.create'],
      }),
    );
  });

  it('does not create an empty draft when inventory is sufficient', async () => {
    const fixture = createAgent({
      1: { product_id: 1, qty: 20, security_stock: 10, unit_cost: 20000 },
    });

    await expect(fixture.agent.execute({
      workflowId: 'wf_1',
      productIds: [1],
      supplierName: 'Supplier A',
      expectedDeliveryDate: '2026-08-01',
    })).resolves.toMatchObject({
      proposal: {
        summary: '0 sản phẩm cần bổ sung tồn kho',
        requested_actions: [],
      },
      receipt: null,
    });
    expect(fixture.writeAdapter.createPurchaseOrderDraft).not.toHaveBeenCalled();
  });

  it('forwards approval proof to the guarded adapter for high-value drafts', async () => {
    const fixture = createAgent({
      1: { product_id: 1, qty: 0, security_stock: 100, unit_cost: 10000 },
    });
    const approval = { status: 'consumed', action_id: 'act_1' };

    await fixture.agent.execute({
      workflowId: 'wf_1',
      productIds: [1],
      supplierName: 'Supplier A',
      expectedDeliveryDate: '2026-08-01',
      actionId: 'act_1',
      idempotencyKey: 'idem_1',
      grantedPermissions: ['purchase_order_draft.create'],
      approval,
    });
    expect(fixture.writeAdapter.createPurchaseOrderDraft)
      .toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ approval }));
  });
});
