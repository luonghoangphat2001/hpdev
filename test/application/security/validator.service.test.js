'use strict';

const EvidenceValidatorPolicy = require('../../../src/policy/permissions/evidence-validator.policy');

describe('T081: Source Evidence Validator Service', () => {
  test('validates fresh evidence references', () => {
    const validator = new EvidenceValidatorPolicy({ maxAgeMinutes: 60 });
    const result = validator.validateEvidence({
      evidenceRefs: ['ssot:order:123'],
      sourceTimestamps: { 'ssot:order:123': new Date().toISOString() },
    });

    expect(result.isValid).toBe(true);
  });

  test('blocks stale evidence references', () => {
    const validator = new EvidenceValidatorPolicy({ maxAgeMinutes: 60 });
    const staleTime = new Date(Date.now() - 120 * 60 * 1000).toISOString();
    const result = validator.validateEvidence({
      evidenceRefs: ['ssot:order:123'],
      sourceTimestamps: { 'ssot:order:123': staleTime },
    });

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('STALE_SOURCE');
  });
});
