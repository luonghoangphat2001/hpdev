'use strict';

const ComplianceEvidenceExportService = require('../../src/application/services/compliance-evidence-export.service');

describe('T088: Compliance Evidence Export Service', () => {
  test('exports audit evidence package', () => {
    const service = new ComplianceEvidenceExportService();
    const pkg = service.exportPackage({
      workflowId: 'wf_123',
      auditTrail: [{ action: 'approve' }],
    });

    expect(pkg.workflowId).toBe('wf_123');
    expect(pkg.auditTrailLength).toBe(1);
  });
});
