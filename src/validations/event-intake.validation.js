/**
 * @fileoverview event-intake.validation - Provides event-intake.validation functionality.
 */
'use strict';

const AppError = require('@utils/errors/app.error');

/**
 * EventIntakeValidation
 * Manages event intake validation logic.
 */
class EventIntakeValidation {
  /**
   * validate - Executes validate.
   * @param {*} req - Input parameter.
   * @returns {*} Result of operation.
   */
  validate(req) {
    if (req.webhookVerification?.valid !== true) {
      throw new AppError('Verified webhook signature is required', 401, {
        code: 'signature_required',
      });
    }

    const payload = req.body;
    const required = ['event_id', 'schema_version', 'event', 'timestamp', 'data'];
    const missing = required.filter((field) => payload?.[field] === undefined);
    if (missing.length > 0) {
      throw new AppError('Invalid event envelope', 400, {
        code: 'invalid_event_envelope',
        missing,
      });
    }

    if (Number.isNaN(Date.parse(payload.timestamp))) {
      throw new AppError('Invalid event timestamp', 400, {
        code: 'invalid_event_timestamp',
      });
    }

    return {
      payload,
      rawBody: req.rawBody || Buffer.from(JSON.stringify(payload)),
      deliveryId: req.webhookVerification.deliveryId,
      keyId: req.webhookVerification.keyId,
    };
  }
}

module.exports = EventIntakeValidation;
