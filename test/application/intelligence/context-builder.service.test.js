'use strict';

const ContextBuilderService = require('@services/ai/context/context-builder.service');

describe('ContextBuilderService', () => {
  test('builds source-grounded context while redacting PII at every boundary', async () => {
    const memoryRepository = {
      findForScopes: jest.fn().mockResolvedValue([{
        agent_id: 'dan_cskh',
        scope_type: 'customer',
        scope_id: 'customer-1',
        memory_key: 'tone',
        memory_value: JSON.stringify({ note: 'Email me at ceo@example.com' }),
        source_ref: 'feedback:9',
        expires_at: '2026-08-01T00:00:00Z',
      }]),
    };
    const service = new ContextBuilderService({
      memoryRepository,
      clock: () => new Date('2026-07-25T08:00:00Z'),
    });

    const context = await service.build({
      agentId: 'dan_cskh',
      scopes: [{ type: 'customer', id: 'customer-1' }],
      workflowContext: { phone: '0901234567', goal: 'Resolve complaint' },
      ssotContext: { customer: { email: 'customer@example.com', tier: 'gold' } },
    });

    expect(context.workflow).toEqual({ phone: '[REDACTED]', goal: 'Resolve complaint' });
    expect(context.ssot).toEqual({ customer: { email: '[REDACTED]', tier: 'gold' } });
    expect(context.memories).toEqual([{
      key: 'tone',
      value: { note: 'Email me at [REDACTED_EMAIL]' },
      sourceRef: 'feedback:9',
      expiresAt: '2026-08-01T00:00:00.000Z',
    }]);
  });
});
