/**
 * @fileoverview Operator - Provides operator functionality.
 */
"use strict";

/**
 * OperatorEvent
 * Manages operator event logic.
 */
class OperatorEvent {
  /**
   * constructor - Executes constructor.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(data = {}) {
    this.eventId = data.eventId || data.event_id;
    this.source = data.source;
    this.eventType = data.eventType || data.event_type;
    this.idempotencyKey = data.idempotencyKey || data.idempotency_key;
    this.payload = data.payload || {};
    this.status = data.status || "received";
    this.receivedAt = data.receivedAt || data.received_at || new Date().toISOString();
  }
}

/**
 * OperatorControl
 * Manages operator control logic.
 */
class OperatorControl {
  /**
   * constructor - Executes constructor.
   * @param {*} data - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(data = {}) {
    this.settingKey = data.settingKey || data.setting_key;
    this.settingValue = data.settingValue || data.setting_value;
    this.updatedBy = data.updatedBy || data.updated_by;
    this.updatedAt = data.updatedAt || data.updated_at || new Date().toISOString();
  }
}

module.exports = { OperatorEvent, OperatorControl };
