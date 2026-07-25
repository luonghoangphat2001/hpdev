'use strict';

const BaseProposalAgent = require('../../domain/agents/base-proposal.agent');
const OrderOperationsService = require('../../domain/agents/ops/order-operations.service');

class OpsAgent extends BaseProposalAgent {
  constructor({
    readAdapter,
    writeAdapter,
    operations = new OrderOperationsService(),
    idFactory,
    clock = () => new Date(),
  }) {
    super({
      agentId: 'dan_ops',
      proposalTypes: ['order_operations'],
      idFactory,
      clock,
    });
    this.readAdapter = readAdapter;
    this.writeAdapter = writeAdapter;
    this.operations = operations;
  }

  async execute({
    workflowId,
    orderId,
    targetStatus = null,
    reason = null,
    executeStatusChange = false,
    actionId,
    idempotencyKey,
    expectedResourceVersion,
    grantedPermissions,
    approval = null,
  }) {
    const orderResult = await this.readAdapter.getOrder(orderId);
    const order = orderResult.data;
    const sla = this.operations.analyzeSla(order, this.clock());
    let actionPayload = null;

    if (targetStatus) {
      this.operations.assertTransition(order.status, targetStatus);
      actionPayload = {
        order_id: orderId,
        target_status: targetStatus,
        ...(reason ? { reason } : {}),
      };
    }

    const proposal = this.createProposal({
      workflowId,
      type: 'order_operations',
      summary: sla.overdue
        ? `Đơn ${orderId} vượt SLA ${sla.elapsed_minutes - sla.threshold_minutes} phút`
        : `Đơn ${orderId} trong SLA`,
      evidence: [{
        source_ref: `order:${orderId}`,
        status: order.status,
        resource_version: order.resource_version || null,
        ...sla,
      }],
      recommendations: sla.overdue
        ? [{ recommendation: 'prioritize_order', order_id: orderId }]
        : [],
      requestedActions: actionPayload
        ? [{ action: 'ops.order_status.update', payload: actionPayload }]
        : [],
    });

    if (!executeStatusChange || !actionPayload) {
      return Object.freeze({ proposal, receipt: null });
    }

    const receipt = await this.writeAdapter.updateOrderStatus(actionPayload, {
      actionId,
      idempotencyKey,
      expectedResourceVersion: expectedResourceVersion || order.resource_version,
      grantedPermissions,
      approval,
    });
    return Object.freeze({ proposal, receipt });
  }
}

module.exports = OpsAgent;
