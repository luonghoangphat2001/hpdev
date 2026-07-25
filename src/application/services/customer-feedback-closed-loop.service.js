'use strict';

class CustomerFeedbackClosedLoopService {
  traceLoop({ feedbackId, rootCause, actionTaken, kpiVerification }) {
    return Object.freeze({
      feedbackId,
      rootCause,
      actionTaken,
      kpiVerification,
      tracedAt: new Date().toISOString(),
      closedLoopVerified: Boolean(kpiVerification && kpiVerification.verified),
    });
  }
}

module.exports = CustomerFeedbackClosedLoopService;
