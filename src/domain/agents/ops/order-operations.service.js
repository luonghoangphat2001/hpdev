'use strict';

const ORDER_TRANSITIONS = Object.freeze({
  pending: Object.freeze(['new', 'cancelled']),
  new: Object.freeze(['processing', 'cancelled']),
  processing: Object.freeze(['delivering', 'cancelled']),
  delivering: Object.freeze(['completed', 'cancelled']),
  completed: Object.freeze(['refunded']),
  cancelled: Object.freeze([]),
  refunded: Object.freeze([]),
});

const DEFAULT_SLA_MINUTES = Object.freeze({
  pending: 5,
  new: 10,
  processing: 30,
  delivering: 60,
});

class OrderOperationsService {
  constructor({ slaMinutes = DEFAULT_SLA_MINUTES } = {}) {
    this.slaMinutes = slaMinutes;
  }

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

  assertTransition(from, to) {
    if (ORDER_TRANSITIONS[from]?.includes(to) !== true) {
      const error = new Error(`Order status transition is not allowed: ${from} -> ${to}`);
      error.code = 'order_status_transition_invalid';
      throw error;
    }
  }
}

module.exports = OrderOperationsService;
module.exports.ORDER_TRANSITIONS = ORDER_TRANSITIONS;
module.exports.DEFAULT_SLA_MINUTES = DEFAULT_SLA_MINUTES;
