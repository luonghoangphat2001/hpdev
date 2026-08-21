/**
 * @fileoverview Agent - Provides agent functionality.
 */
"use strict";

/**
 * Agent
 * Manages agent logic.
 */
class Agent {
  /**
   * constructor - Executes constructor.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(data = {}) {
    this.agentId = data.agentId || data.agent_id;
    this.goalId = data.goalId || data.goal_id;
    this.autonomyLevel = data.autonomyLevel || data.autonomy_level || 0;
    this.lifecycleState = data.lifecycleState || data.lifecycle_state || "draft";
    this.limits = data.limits || {};
    this.enabled = Boolean(data.enabled);
    this.version = data.version || data.state_version || 1;
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
  }
}

module.exports = Agent;
