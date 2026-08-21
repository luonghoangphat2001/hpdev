/**
 * @fileoverview Ceo - Provides ceo functionality.
 */
"use strict";

/**
 * CeoCommand
 * Manages ceo command logic.
 */
class CeoCommand {
  /**
   * constructor - Executes constructor.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(data = {}) {
    this.requestId = data.requestId || data.request_id;
    this.idempotencyKey = data.idempotencyKey || data.idempotency_key;
    this.commandName = data.commandName || data.command_name;
    this.commandVersion = data.commandVersion || data.command_version || "1.0.0";
    this.actorId = data.actorId || data.actor_id;
    this.risk = data.risk || data.risk_level || "low";
    this.payload = data.payload || {};
    this.status = data.status || "processing";
    this.result = data.result || null;
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.completedAt = data.completedAt || data.completed_at || null;
  }
}

/**
 * CeoException
 * Manages ceo exception logic.
 */
class CeoException {
  /**
   * constructor - Executes constructor.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(data = {}) {
    this.exceptionId = data.exceptionId || data.exception_id;
    this.sourceType = data.sourceType || data.source_type;
    this.sourceId = data.sourceId || data.source_id;
    this.workflowId = data.workflowId || data.workflow_id;
    this.severity = data.severity || "medium";
    this.title = data.title;
    this.context = data.context || {};
    this.status = data.status || "open";
    this.occurredAt = data.occurredAt || data.occurred_at || new Date().toISOString();
  }
}

module.exports = { CeoCommand, CeoException };
