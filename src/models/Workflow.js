/**
 * @fileoverview Workflow - Provides workflow functionality.
 */
"use strict";

/**
 * Workflow
 * Manages workflow logic.
 */
class Workflow {
  /**
   * constructor - Executes constructor.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(data = {}) {
    this.workflowId = data.workflowId || data.workflow_id;
    this.eventId = data.eventId || data.event_id;
    this.correlationId = data.correlationId || data.correlation_id;
    this.workflowType = data.workflowType || data.workflow_type;
    this.state = data.state || "received";
    this.assignedAgentId = data.assignedAgentId || data.assigned_agent_id;
    this.riskLevel = data.riskLevel || data.risk_level || "low";
    this.priority = data.priority ?? 50;
    this.policyVersion = data.policyVersion || data.policy_version || "1.0.0";
    this.inputContext = data.inputContext || data.input_context || {};
    this.stateVersion = data.stateVersion || data.state_version || 1;
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.completedAt = data.completedAt || data.completed_at || null;
  }
}

module.exports = Workflow;
