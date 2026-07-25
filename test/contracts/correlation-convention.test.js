'use strict';

const convention = require('../../src/contracts/identity/correlation-convention');
const {
  CorrelationConvention,
  REQUIRED_LOG_FIELDS,
} = require('../../src/contracts/identity/correlation-convention');

describe('CorrelationConvention', () => {
  const uuid = '123e4567-e89b-42d3-a456-426614174000';
  const deterministic = new CorrelationConvention(() => uuid);

  it('creates typed UUID identifiers', () => {
    expect(deterministic.createId('event')).toBe(`evt_${uuid}`);
    expect(deterministic.createId('workflow')).toBe(`wf_${uuid}`);
    expect(deterministic.createId('action')).toBe(`act_${uuid}`);
    expect(deterministic.isValidId('event', `evt_${uuid}`)).toBe(true);
    expect(deterministic.isValidId('event', `wf_${uuid}`)).toBe(false);
  });

  it('rejects unknown identifier types', () => {
    expect(() => convention.createId('database')).toThrow('Unknown identifier type');
    expect(convention.isValidId('database', 'db_1')).toBe(false);
  });

  it('creates stable idempotency keys independent of object key order', () => {
    const first = convention.createIdempotencyKey({
      scope: 'Order Status',
      operation: 'ops.order_status.update',
      subject: 'order:123',
      payloadVersion: 7,
      payload: { status: 'completed', note: 'ok' },
    });
    const second = convention.createIdempotencyKey({
      scope: 'Order Status',
      operation: 'ops.order_status.update',
      subject: 'order:123',
      payloadVersion: 7,
      payload: { note: 'ok', status: 'completed' },
    });

    expect(first).toBe(second);
    expect(first).toMatch(/^idem:v1:order-status:[a-f0-9]{64}$/);
  });

  it('changes the key when resource version or payload changes', () => {
    const base = {
      scope: 'order',
      operation: 'update',
      subject: 'order:123',
      payloadVersion: 1,
      payload: { status: 'paid' },
    };

    expect(convention.createIdempotencyKey(base)).not.toBe(
      convention.createIdempotencyKey({ ...base, payloadVersion: 2 }),
    );
  });

  it('creates a shared correlation context without inventing absent IDs', () => {
    expect(deterministic.createContext({ eventId: `evt_${uuid}` })).toEqual({
      event_id: `evt_${uuid}`,
      workflow_id: null,
      action_id: null,
      correlation_id: `cor_${uuid}`,
    });
  });

  it('defines the required structured log correlation fields', () => {
    expect(REQUIRED_LOG_FIELDS).toEqual([
      'timestamp',
      'level',
      'event_id',
      'workflow_id',
      'action_id',
      'agent_id',
      'correlation_id',
      'error_code',
    ]);
  });
});
