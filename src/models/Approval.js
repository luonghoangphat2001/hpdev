/**
 * @fileoverview Approval - Provides approval functionality.
 */
"use strict";

/**
 * Approval
 * Manages approval logic.
 */
class Approval {
  /**
   * constructor - Executes constructor.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(data = {}) {
    this.approvalId = data.approvalId || data.approval_id;
    this.workflowId = data.workflowId || data.workflow_id;
    this.actionId = data.actionId || data.action_id;
    this.riskLevel = data.riskLevel || data.risk_level || "medium";
    this.status = data.status || "pending";
    this.actorId = data.actorId || data.actor_id || null;
    this.requestedAt = data.requestedAt || data.requested_at || new Date().toISOString();
    this.expiresAt = data.expiresAt || data.expires_at || null;
    this.decidedAt = data.decidedAt || data.decided_at || null;
  }
}

module.exports = Approval;
