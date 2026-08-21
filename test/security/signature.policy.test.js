'use strict';

const SignaturePolicy = require('../../src/policy/permissions/signature.policy');
const { SIGNATURE_POLICY } = require('../../src/policy/permissions/signature.policy');

describe('SignaturePolicy', () => {
  const nowSeconds = 1784966400;
  const keys = {
    '2026-07-current': 'current-secret',
    '2026-06-previous': 'previous-secret',
  };
  const service = new SignaturePolicy({
    keys,
    now: () => nowSeconds * 1000,
  });
  const request = {
    body: '{"event":"order.created"}',
    timestamp: nowSeconds,
    deliveryId: 'delivery-123',
    keyId: '2026-07-current',
  };

  it('signs a canonical string and verifies it in constant-time format', () => {
    const signature = service.sign(request);
    const result = service.verify({ ...request, signature });

    expect(signature).toMatch(/^v1=[a-f0-9]{64}$/);
    expect(result).toEqual({
      valid: true,
      replayKey: 'webhook:2026-07-current:delivery-123',
      replayTtlSeconds: SIGNATURE_POLICY.replayTtlSeconds,
    });
  });

  it('rejects tampered body and delivery identifiers', () => {
    const signature = service.sign(request);

    expect(service.verify({ ...request, body: '{}', signature }))
      .toEqual({ valid: false, reason: 'signature_mismatch' });
    expect(service.verify({ ...request, deliveryId: 'other', signature }))
      .toEqual({ valid: false, reason: 'signature_mismatch' });
  });

  it('rejects stale timestamps before signature comparison', () => {
    const stale = {
      ...request,
      timestamp: nowSeconds - SIGNATURE_POLICY.maxClockSkewSeconds - 1,
    };

    expect(service.verify({ ...stale, signature: service.sign(stale) }))
      .toEqual({ valid: false, reason: 'timestamp_outside_window' });
  });

  it('supports previous keys during rotation overlap', () => {
    const rotatedRequest = { ...request, keyId: '2026-06-previous' };
    const signature = service.sign(rotatedRequest);

    expect(service.verify({ ...rotatedRequest, signature }).valid).toBe(true);
  });

  it('fails closed for unknown keys and malformed signatures', () => {
    expect(service.verify({ ...request, keyId: 'missing', signature: 'v1=abc' }))
      .toEqual({ valid: false, reason: 'unknown_key_id' });
    expect(service.verify({ ...request, signature: 'abc' }))
      .toEqual({ valid: false, reason: 'invalid_signature_format' });
  });

  it('requires key material at construction time', () => {
    expect(() => new SignaturePolicy({ keys: {} }))
      .toThrow('At least one webhook signing key is required');
  });
});
