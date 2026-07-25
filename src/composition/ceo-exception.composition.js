'use strict';

const env = require('../config/env');
const mysqlPoolFactory = require('../infrastructure/database/mysql-pool');
const MysqlCeoExceptionRepository =
  require('../infrastructure/database/repositories/mysql-ceo-exception.repository');
const DanAiNotificationClient = require('../infrastructure/http/dan-ai-notification.client');
const DanAiNotificationAdapter = require('../application/adapters/dan-ai-notification.adapter');
const CeoExceptionInboxService =
  require('../application/services/ceo-exception-inbox.service');
const CeoExceptionController = require('../controllers/ceo-exception.controller');
const CeoExceptionRoute = require('../routes/ceo-exception.route');

function buildCeoExceptionRouter({
  config = env,
  pool = mysqlPoolFactory.create(config.orchestratorDatabase),
  notificationGateway = null,
} = {}) {
  let gateway = notificationGateway;
  if (!gateway && config.danAiApi?.baseUrl && config.danAiApi?.apiSecret) {
    gateway = new DanAiNotificationAdapter(
      new DanAiNotificationClient({ config: config.danAiApi })
    );
  }
  const service = new CeoExceptionInboxService({
    repository: new MysqlCeoExceptionRepository(pool),
    notificationGateway: gateway,
    allowedActorIds: config.ceoDiscordUserIds,
  });
  return new CeoExceptionRoute(new CeoExceptionController(service)).router;
}

module.exports = { buildCeoExceptionRouter };
