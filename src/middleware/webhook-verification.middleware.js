/**
 * @fileoverview webhook-verification.middleware - Provides webhook-verification functionality.
 */
'use strict';

/**
 * WebhookVerificationMiddleware
 * Manages webhook verification logic.
 */
class WebhookVerificationMiddleware {
  /**
   * constructor - Executes constructor.
   * @param {*} signatureService - Input parameter.
   * @param {*} eventRepository - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor({ signatureService, eventRepository }) {
    this.signatureService = signatureService;
    this.eventRepository = eventRepository;
  }

  /**
   * handle - Asynchronously executes handle.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @param {import('express').NextFunction} [next] - Express next middleware function.
   * @returns {*} Promise resolving result.
   */
  async handle(req, res, next) {
    const timestamp = req.get('x-openclaw-timestamp');
    const deliveryId = req.get('x-openclaw-delivery-id');
    const keyId = req.get('x-openclaw-key-id');
    const signature = req.get('x-openclaw-signature');
    const verification = this.signatureService.verify({
      body: req.rawBody || Buffer.from(JSON.stringify(req.body || {})),
      timestamp,
      deliveryId,
      keyId,
      signature,
    });

    if (!verification.valid) {
      return res.status(401).json({
        error: 'Invalid webhook signature',
        code: verification.reason,
      });
    }

    const duplicate = await this.findDuplicate(req.body?.event_id, deliveryId);
    if (duplicate) {
      return res.status(202).json({
        event_id: duplicate.event_id,
        correlation_id: duplicate.correlation_id,
        status: 'duplicate',
      });
    }

    req.webhookVerification = {
      ...verification,
      deliveryId,
      keyId,
    };
    return next();
  }

  /**
   * findDuplicate - Asynchronously executes find duplicate.
   * @param {*} eventId - Input parameter.
   * @param {*} deliveryId - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async findDuplicate(eventId, deliveryId) {
    const delivery = await this.eventRepository.findByDeliveryId(deliveryId);
    if (delivery) {
      return delivery;
    }

    return eventId ? this.eventRepository.findByEventId(eventId) : null;
  }
}

function parseSigningKeys(rawKeys) {
  if (!rawKeys) {
    return null;
  }
  if (typeof rawKeys === 'object' && !Array.isArray(rawKeys)) {
    return Object.keys(rawKeys).length > 0 ? Object.freeze({ ...rawKeys }) : null;
  }
  if (typeof rawKeys === 'string') {
    try {
      const parsed = JSON.parse(rawKeys);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.keys(parsed).length > 0 ? Object.freeze(parsed) : null;
      }
    } catch (_error) {
      return null;
    }
  }
  return null;
}

function unavailableMiddleware(arg1 = 'Service temporarily unavailable', arg2) {
  if (arg2 && typeof arg2.status === 'function') {
    return arg2.status(503).json({ error: typeof arg1 === 'string' ? arg1 : 'Service temporarily unavailable' });
  }
  const message = typeof arg1 === 'string' ? arg1 : 'Service temporarily unavailable';
  return (_req, res) => res.status(503).json({ error: message });
}

module.exports = WebhookVerificationMiddleware;
module.exports.WebhookVerificationMiddleware = WebhookVerificationMiddleware;
module.exports.parseSigningKeys = parseSigningKeys;
module.exports.unavailableMiddleware = unavailableMiddleware;

