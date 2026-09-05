/**
 * @fileoverview index - Provides index functionality.
 */
'use strict';

module.exports = Object.freeze([
  require('@database/migrations/001-create-orchestrator-events'),
  require('@database/migrations/002-create-workflows'),
  require('@database/migrations/003-create-workflow-actions'),
  require('@database/migrations/004-create-approval-requests'),
  require('@database/migrations/005-create-audit-events'),
  require('@database/migrations/006-create-outbox-jobs'),
  require('@database/migrations/007-create-dead-letters'),
  require('@database/migrations/008-create-agent-memories'),
  require('@database/migrations/009-add-operator-control'),
  require('@database/migrations/010-create-intelligence-observability'),
  require('@database/migrations/011-create-goals'),
  require('@database/migrations/012-create-ceo-command-requests'),
  require('@database/migrations/013-create-ceo-exceptions'),
  require('@database/migrations/014-create-decision-journal'),
  require('@database/migrations/015-create-agent-autonomy-settings'),
  require('@database/migrations/016-create-sop-playbooks'),
  require('@database/migrations/017-create-agent-runtime-states'),
]);
