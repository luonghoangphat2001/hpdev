'use strict';

const logger = require('../../services/logger.service');
const { REQUIRED_LOG_FIELDS } = require('../../contracts/identity/correlation-convention');

const STAGE_REQUIREMENTS = Object.freeze({
  event: Object.freeze(['event_id', 'correlation_id']),
  workflow: Object.freeze(['event_id', 'workflow_id', 'correlation_id']),
  agent: Object.freeze(['event_id', 'workflow_id', 'agent_id', 'correlation_id']),
  action: Object.freeze([
    'event_id',
    'workflow_id',
    'agent_id',
    'action_id',
    'correlation_id',
  ]),
  receipt: Object.freeze([
    'event_id',
    'workflow_id',
    'agent_id',
    'action_id',
    'correlation_id',
    'receipt_id',
  ]),
});

class OrchestrationLoggerService {
  constructor({
    sink = logger,
    clock = () => new Date(),
    baseContext = {},
  } = {}) {
    this.sink = sink;
    this.clock = clock;
    this.baseContext = Object.freeze({ ...baseContext });
  }

  child(context) {
    return new OrchestrationLoggerService({
      sink: this.sink,
      clock: this.clock,
      baseContext: { ...this.baseContext, ...context },
    });
  }

  info(stage, message, context = {}) {
    return this.write('info', stage, message, context);
  }

  error(stage, message, context = {}) {
    return this.write('error', stage, message, context);
  }

  write(level, stage, message, context = {}) {
    const merged = { ...this.baseContext, ...context };
    this.assertLineage(stage, merged);

    const entry = {
      timestamp: this.clock().toISOString(),
      event_id: null,
      workflow_id: null,
      action_id: null,
      agent_id: null,
      correlation_id: null,
      error_code: null,
      ...merged,
      stage,
      log_schema_version: '1.0.0',
    };
    this.sink.write(level, message, entry);
    return Object.freeze({ level, message, ...entry });
  }

  assertLineage(stage, context) {
    const required = STAGE_REQUIREMENTS[stage];
    if (!required) {
      throw new TypeError(`Unknown orchestration log stage: ${stage}`);
    }

    const missing = required.filter((field) => !context[field]);
    if (missing.length > 0) {
      throw new TypeError(`Missing ${stage} lineage fields: ${missing.join(', ')}`);
    }
  }

  static requiredFields() {
    return REQUIRED_LOG_FIELDS;
  }
}

module.exports = OrchestrationLoggerService;
module.exports.STAGE_REQUIREMENTS = STAGE_REQUIREMENTS;
