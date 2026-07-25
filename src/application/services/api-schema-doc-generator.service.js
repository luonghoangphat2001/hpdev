'use strict';

class ApiSchemaDocGeneratorService {
  generateDocs() {
    return Object.freeze({
      version: '1.0.0',
      title: 'OpenClaw Orchestrator API & Schema Reference',
      events: ['order.created', 'inventory.depleted'],
      actions: ['cfo.refund.issue', 'logistics.purchase_order.create'],
      compatibilityMatrix: Object.freeze({
        ssotVersion: 'v2.4',
        openclawVersion: 'v1.0',
      }),
      generatedAt: new Date().toISOString(),
    });
  }
}

module.exports = ApiSchemaDocGeneratorService;
