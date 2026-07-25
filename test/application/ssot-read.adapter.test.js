'use strict';

const SsotReadAdapter = require('../../src/application/adapters/ssot-read.adapter');

describe('SsotReadAdapter', () => {
  function setup(options = {}) {
    const client = {
      request: jest.fn().mockResolvedValue({
        data: [{ id: 1 }],
        meta: { page: 1 },
      }),
    };
    return {
      client,
      adapter: new SsotReadAdapter({
        client,
        allowPlanned: true,
        clock: () => new Date('2026-07-25T00:00:00.000Z'),
        ...options,
      }),
    };
  }

  it('builds encoded resource paths without leaking path fields into query', async () => {
    const { client, adapter } = setup();
    await adapter.getOrder('order/1');

    expect(client.request).toHaveBeenCalledWith({
      actionName: 'order.read',
      method: 'GET',
      path: '/api/v1/storefront/agents/orders/order%2F1',
      params: {},
    });
  });

  it('passes validated list filters as query parameters', async () => {
    const { client, adapter } = setup();
    await adapter.listOrders({ page: 2, per_page: 25, status: 'processing' });

    expect(client.request).toHaveBeenCalledWith(expect.objectContaining({
      path: '/api/v1/storefront/agents/orders',
      actionName: 'order.list',
      params: { page: 2, per_page: 25, status: 'processing' },
    }));
  });

  it('returns one canonical read DTO for every business domain', async () => {
    const { adapter } = setup();
    const results = await Promise.all([
      adapter.getOrder(1),
      adapter.getProduct(2),
      adapter.getInventory(2),
      adapter.getFinanceSummary('month'),
      adapter.listCustomerFeedback({ sentiment: 'negative' }),
    ]);

    results.forEach((result) => {
      expect(result).toMatchObject({
        schema_version: '1.0.0',
        source: 'ecommerce',
        data: [{ id: 1 }],
        meta: { page: 1 },
        fetched_at: '2026-07-25T00:00:00.000Z',
      });
    });
  });

  it('validates payload before making an external call', async () => {
    const { client, adapter } = setup();
    await expect(adapter.getFinanceSummary('forever'))
      .rejects.toMatchObject({ statusCode: 422 });
    expect(client.request).not.toHaveBeenCalled();
  });

  it('blocks planned endpoints by default', async () => {
    const client = { request: jest.fn() };
    const adapter = new SsotReadAdapter({ client });

    await expect(adapter.getOrder(1)).rejects.toMatchObject({
      statusCode: 503,
      details: {
        code: 'ssot_action_unavailable',
        action: 'order.read',
      },
    });
    expect(client.request).not.toHaveBeenCalled();
  });
});
