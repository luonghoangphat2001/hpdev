/**
 * @fileoverview Sop - Provides sop functionality.
 */
"use strict";

/**
 * SopPlaybook
 * Manages sop playbook logic.
 */
class SopPlaybook {
  /**
   * constructor - Executes constructor.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(data = {}) {
    this.sopId = data.sopId || data.sop_id;
    this.name = data.name;
    this.version = data.version || "1.0.0";
    this.definition = data.definition || {};
    this.enabled = Boolean(data.enabled);
    this.createdAt = data.createdAt || data.created_at || new Date().toISOString();
    this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
  }
}

module.exports = SopPlaybook;
