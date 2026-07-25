'use strict';

module.exports = Object.freeze([
  require('./001-create-orchestrator-events'),
  require('./002-create-workflows'),
  require('./003-create-workflow-actions'),
  require('./004-create-approval-requests'),
  require('./005-create-audit-events'),
  require('./006-create-outbox-jobs'),
  require('./007-create-dead-letters'),
  require('./008-create-agent-memories'),
  require('./009-add-operator-control'),
  require('./010-create-intelligence-observability'),
  require('./011-create-goals'),
  require('./012-create-ceo-command-requests'),
  require('./013-create-ceo-exceptions'),
  require('./014-create-decision-journal'),
]);
