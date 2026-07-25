'use strict';

const SsotWriteAdapter = require('../../src/application/adapters/ssot-write.adapter');

describe('SsotWriteAdapter', () => {
  const idempotencyKey = `idem:v1:action:${'a'.repeat(64)}`;
  const receipt = {
    action_id: 'remote_action_1',
    idempotency_key: idempotencyKey,
    status: 'completed',
    resource_type: 'order',
    resource_id: '1',
    resource_version: '2',
    executed_at: '2026-07-25T00:00:00.000Z',
  };

  function setup() {
    const client = { request: jest.fn().mockResolvedValue(receipt) };
    return {
      client,
      adapter: new SsotWriteAdapter({ client, allowPlanned: true }),
    };
  }

  it('executes an allowed medium-risk write with idempotency key', async () => {
    const { client, adapter } = setup();
    await expect(adapter.createPurchaseOrderDraft({
      supplier_name: 'Supplier A',
      total_amount: 100000,
      expected_delivery_date: '2026-08-01',
    }, {
      actionId: 'act_1',
      idempotencyKey,
      grantedPermissions: ['purchase_order_draft.create'],
    })).resolves.toEqual(receipt);

    expect(client.request).toHaveBeenCalledWith({
      actionName: 'inventory.purchase_order_draft.create',
      method: 'POST',
      path: '/api/v1/storefront/agents/purchase-orders/drafts',
      data: {
        supplier_name: 'Supplier A',
        total_amount: 100000,
        expected_delivery_date: '2026-08-01',
      },
      idempotencyKey,
    });
  });

  it('requires consumed approval bound to the same high-risk action', async () => {
    const { client, adapter } = setup();
    const options = {
      actionId: 'act_refund',
      idempotencyKey,
      grantedPermissions: ['refund.execute'],
    };

    await expect(adapter.executeRefund({
      order_id: 1,
      amount: 50000,
      reason: 'Customer request',
    }, options)).rejects.toMatchObject({
      statusCode: 409,
      details: { code: 'action_approval_required', action_id: 'act_refund' },
    });
    expect(client.request).not.toHaveBeenCalled();

    await expect(adapter.executeRefund({
      order_id: 1,
      amount: 50000,
      reason: 'Customer request',
    }, {
      ...options,
      approval: { status: 'consumed', action_id: 'act_refund' },
    })).resolves.toEqual(receipt);
  });

  it('strips policy-only confidence before sending CSKH business payload', async () => {
    const { client, adapter } = setup();
    await adapter.sendCustomerResponse({
      feedback_id: 5,
      reply_content: 'Xin lỗi quý khách.',
      confidence: 0.95,
    }, {
      actionId: 'act_1',
      idempotencyKey,
      grantedPermissions: ['cskh_response.send'],
    });

    expect(client.request).toHaveBeenCalledWith(expect.objectContaining({
      path: '/api/v1/storefront/agents/customer-feedback/5/responses',
      data: { reply_content: 'Xin lỗi quý khách.' },
    }));
  });

  it('rejects missing permission and malformed idempotency key before HTTP', async () => {
    const { client, adapter } = setup();
    const payload = {
      supplier_name: 'Supplier A',
      total_amount: 100000,
      expected_delivery_date: '2026-08-01',
    };

    await expect(adapter.createPurchaseOrderDraft(payload, {
      actionId: 'act_1',
      idempotencyKey,
      grantedPermissions: [],
    })).rejects.toMatchObject({ statusCode: 403 });
    await expect(adapter.createPurchaseOrderDraft(payload, {
      actionId: 'act_1',
      idempotencyKey: 'bad',
      grantedPermissions: ['purchase_order_draft.create'],
    })).rejects.toMatchObject({ statusCode: 422 });
    expect(client.request).not.toHaveBeenCalled();
  });

  it('rejects incomplete SSOT receipts', async () => {
    const { adapter, client } = setup();
    client.request.mockResolvedValue({ status: 'completed' });

    await expect(adapter.createPurchaseOrderDraft({
      supplier_name: 'Supplier A',
      total_amount: 100000,
      expected_delivery_date: '2026-08-01',
    }, {
      actionId: 'act_1',
      idempotencyKey,
      grantedPermissions: ['purchase_order_draft.create'],
    })).rejects.toMatchObject({
      statusCode: 502,
      details: expect.objectContaining({ code: 'ssot_receipt_invalid' }),
    });
  });

  it('blocks planned endpoints by default', async () => {
    const client = { request: jest.fn() };
    const adapter = new SsotWriteAdapter({ client });

    await expect(adapter.createPurchaseOrderDraft({
      supplier_name: 'Supplier A',
      total_amount: 100000,
      expected_delivery_date: '2026-08-01',
    }, {
      actionId: 'act_1',
      idempotencyKey,
      grantedPermissions: ['purchase_order_draft.create'],
    })).rejects.toMatchObject({ statusCode: 503 });
  });
});
