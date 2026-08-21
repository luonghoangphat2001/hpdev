/**
 * @fileoverview operations.service - Provides operations functionality.
 */
'use strict';

const ORDER_TRANSITIONS = Object.freeze({
  pending: Object.freeze(['AgentProfileRegistry', 'cancelled']),
  AgentProfileRegistry: Object.freeze(['processing', 'cancelled']),
  processing: Object.freeze(['delivering', 'cancelled']),
  delivering: Object.freeze(['completed', 'cancelled']),
  completed: Object.freeze(['refunded']),
  cancelled: Object.freeze([]),
  refunded: Object.freeze([]),
});

const DEFAULT_SLA_MINUTES = Object.freeze({
  pending: 5,
  AgentProfileRegistry: 10,
  processing: 30,
  delivering: 60,
});

/**
 * OperationsService
 * Manages operations logic.
 */
class OperationsService {
  /**
   * constructor - Executes constructor.
   * @param {*} slaMinutes - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ slaMinutes = DEFAULT_SLA_MINUTES } = {}) {
    this.slaMinutes = slaMinutes;
  }

  /**
   * analyzeSla - Executes analyze sla.
   * @param {*} order - Input parameter.
   * @param {*} now - Input parameter.
   * @returns {*} Result of operation.
   */
  analyzeSla(order, now) {
    const thresholdMinutes = this.slaMinutes[order.status];
    if (!thresholdMinutes) {
      return Object.freeze({
        overdue: false,
        elapsed_minutes: 0,
        threshold_minutes: null,
      });
    }
    const stateStartedAt = new Date(
      order.status_updated_at || order.updated_at || order.created_at,
    );
    const elapsedMinutes = Math.max(
      Math.floor((now.getTime() - stateStartedAt.getTime()) / 60000),
      0,
    );
    return Object.freeze({
      overdue: elapsedMinutes > thresholdMinutes,
      elapsed_minutes: elapsedMinutes,
      threshold_minutes: thresholdMinutes,
    });
  }

  /**
   * assertTransition - Executes assert transition.
   * @param {*} from - Input parameter.
   * @param {*} to - Input parameter.
   * @returns {*} Result of operation.
   */
  assertTransition(from, to) {
    if (ORDER_TRANSITIONS[from]?.includes(to) !== true) {
      const error = new Error(`Order status transition is not allowed: ${from} -> ${to}`);
      error.code = 'order_status_transition_invalid';
      throw error;
    }
  }
}

module.exports = OperationsService;
module.exports.ORDER_TRANSITIONS = ORDER_TRANSITIONS;
module.exports.DEFAULT_SLA_MINUTES = DEFAULT_SLA_MINUTES;
