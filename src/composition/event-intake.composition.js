'use strict';

const env = require('../config/env');
const mysqlPoolFactory = require('../infrastructure/database/mysql-pool');
const MysqlEventRepository = require('../infrastructure/database/repositories/mysql-event.repository');
const WebhookSignatureService = require('../security/webhook-signature.service');
const WebhookVerificationMiddleware = require('../middlewares/webhook-verification.middleware');
const EventIntakeService = require('../application/services/operator/event-intake.service');
const EventIntakeController = require('../controllers/event-intake.controller');
const EventIntakeRoute = require('../routes/event-intake.route');

function parseSigningKeys(rawJson) {
  if (!rawJson) {
    return null;
  }

  try {
    const keys = JSON.parse(rawJson);
    return keys && typeof keys === 'object' && Object.keys(keys).length > 0
      ? keys
      : null;
  } catch (_error) {
    return null;
  }
}

function unavailableMiddleware(_req, res) {
  return res.status(503).json({
    error: 'Webhook verification is not configured',
    code: 'webhook_keys_not_configured',
  });
}

function buildEventIntakeRouter({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
} = {}) {
  const repository = new MysqlEventRepository(pool);
  const keys = parseSigningKeys(config.ecommerceWebhookKeysJson);
  let verificationMiddleware = unavailableMiddleware;

  if (keys) {
    const middleware = new WebhookVerificationMiddleware({
      signatureService: new WebhookSignatureService({ keys }),
      eventRepository: repository,
    });
    verificationMiddleware = middleware.handle.bind(middleware);
  }

  const service = new EventIntakeService({ eventRepository: repository });
  const controller = new EventIntakeController(service);

  return new EventIntakeRoute({ controller, verificationMiddleware }).router;
}

module.exports = {
  buildEventIntakeRouter,
  parseSigningKeys,
  unavailableMiddleware,
};
