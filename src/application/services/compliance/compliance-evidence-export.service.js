'use strict';

class ComplianceEvidenceExportService {
  exportPackage({ workflowId, auditTrail = [], metadata = {} }) {
    return Object.freeze({
      workflowId,
      exportedAt: new Date().toISOString(),
      metadata,
      auditTrailLength: auditTrail.length,
      checksum: 'sha256_mock_checksum',
    });
  }
}

module.exports = ComplianceEvidenceExportService;
