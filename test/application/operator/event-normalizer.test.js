'use strict';

const NormalizerService = require('@services/operator/event/normalizer.service');

describe('NormalizerService', () => {
  const normalizer = new NormalizerService();
  const envelope = {
    event_id: 'evt_123e4567-e89b-42d3-a456-426614174000',
    schema_version: '1.0.0',
    event: 'order.created',
    timestamp: '2026-07-25T00:00:00.000Z',
    correlation_id: 'cor_123',
    webhook_id: 7,
    data: { id: 123 },
    changes: {},
  };

  it('normalizes a valid Ecommerce envelope into the canonical event DTO', () => {
    expect(normalizer.normalize(envelope)).toEqual({
      schema_version: '1.0.0',
      event_id: envelope.event_id,
      event_type: 'order.created',
      occurred_at: envelope.timestamp,
      source: 'ecommerce',
      correlation_id: 'cor_123',
      payload: {
        webhook_id: '7',
        data: { id: 123 },
        changes: {},
      },
    });
  });

  it.each([
    ['unknown event', { event: 'user.created' }],
    ['wrong schema version', { schema_version: '2.0.0' }],
    ['invalid timestamp', { timestamp: 'yesterday' }],
    ['extra root field', { unexpected: true }],
  ])('rejects %s with a stable error code', (_label, patch) => {
    expect(() => normalizer.normalize({ ...envelope, ...patch }))
      .toThrow(expect.objectContaining({
        statusCode: 422,
        details: expect.objectContaining({
          code: 'event_schema_invalid',
          errors: expect.any(Array),
        }),
      }));
  });

  it('reports missing required fields with their schema path', () => {
    const invalid = { ...envelope };
    delete invalid.data;

    try {
      normalizer.normalize(invalid);
      throw new Error('Expected validation failure');
    } catch (error) {
      expect(error.details.code).toBe('event_schema_invalid');
      expect(error.details.errors).toEqual(expect.arrayContaining([
        expect.objectContaining({
          keyword: 'required',
        }),
      ]));
    }
  });
});
