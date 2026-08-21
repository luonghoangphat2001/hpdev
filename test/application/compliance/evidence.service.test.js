'use strict';

const EvidenceExportPolicy = require('../../../src/policy/compliance/evidence-export.policy');

describe('T088: Compliance Evidence Export Service', () => {
  test('exports audit evidence package', () => {
    const service = new EvidenceExportPolicy();
    const pkg = service.exportPackage({
      workflowId: 'wf_123',
      auditTrail: [{ action: 'approve' }],
    });

    expect(pkg.workflowId).toBe('wf_123');
    expect(pkg.auditTrailLength).toBe(1);
  });
});
