/**
 * @fileoverview logistics.agent - Provides logistics.agent functionality.
 */
'use strict';

const BaseProposalAgent = require('@services/ai/agents/base-proposal.agent');
const ReorderService = require('@services/ai/agents/logistics/reorder.service');

/**
 * LogisticsAgent
 * Manages logistics agent logic.
 */
class LogisticsAgent extends BaseProposalAgent {
  constructor({
    readAdapter,
    writeAdapter,
    reorderService = new ReorderService(),
    idFactory,
    clock,
  }) {
    super({
      agentId: 'dan_logistics',
      proposalTypes: ['purchase_order_draft'],
      idFactory,
      clock,
    });
    this.readAdapter = readAdapter;
    this.writeAdapter = writeAdapter;
    this.reorderService = reorderService;
  }

  async execute({
    workflowId,
    productIds,
    supplierName,
    expectedDeliveryDate,
    actionId,
    idempotencyKey,
    grantedPermissions,
    approval = null,
  }) {
    const inventoryResults = await Promise.all(
      productIds.map((productId) => this.readAdapter.getInventory(productId)),
    );
    const inventoryItems = inventoryResults.map((result) => result.data);
    const analysis = this.reorderService.calculate(inventoryItems);
    const actionPayload = {
      supplier_name: supplierName,
      total_amount: analysis.total_amount,
      expected_delivery_date: expectedDeliveryDate,
    };
    const proposal = this.createProposal({
      workflowId,
      type: 'purchase_order_draft',
      summary: `${analysis.shortages.length} sản phẩm cần bổ sung tồn kho`,
      evidence: analysis.shortages.map((item) => ({
        source_ref: `inventory:${item.product_id}`,
        ...item,
      })),
      recommendations: analysis.shortages.map((item) => ({
        product_id: item.product_id,
        reorder_quantity: item.reorder_quantity,
      })),
      requestedActions: analysis.shortages.length > 0
        ? [{
          action: 'inventory.purchase_order_draft.create',
          payload: actionPayload,
        }]
        : [],
    });

    if (analysis.shortages.length === 0) {
      return Object.freeze({ proposal, receipt: null });
    }

    const receipt = await this.writeAdapter.createPurchaseOrderDraft(
      actionPayload,
      {
        actionId,
        idempotencyKey,
        grantedPermissions,
        approval,
      },
    );
    return Object.freeze({ proposal, receipt });
  }
}

module.exports = LogisticsAgent;
