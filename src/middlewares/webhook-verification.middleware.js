'use strict';

class WebhookVerificationMiddleware {
  constructor({ signatureService, eventRepository }) {
    this.signatureService = signatureService;
    this.eventRepository = eventRepository;
  }

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

  async findDuplicate(eventId, deliveryId) {
    const delivery = await this.eventRepository.findByDeliveryId(deliveryId);
    if (delivery) {
      return delivery;
    }

    return eventId ? this.eventRepository.findByEventId(eventId) : null;
  }
}

module.exports = WebhookVerificationMiddleware;
