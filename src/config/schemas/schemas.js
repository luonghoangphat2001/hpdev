'use strict';

const { MODEL_CONFIG_SCHEMA } = require('./models.schema');
const { AGENT_CONFIG_SCHEMA, MONITORED_AGENTS } = require('./agents.schema');
const { SYSTEM_CONFIG_SCHEMA } = require('./system.schema');
const { LEARNING_CONFIG_SCHEMA } = require('./learning.schema');

const CONFIG_SCHEMA = [
  ...MODEL_CONFIG_SCHEMA,
  ...AGENT_CONFIG_SCHEMA,
  ...SYSTEM_CONFIG_SCHEMA,
  ...LEARNING_CONFIG_SCHEMA,
];

module.exports = {
  CONFIG_SCHEMA,
  MONITORED_AGENTS,
  MODEL_CONFIG_SCHEMA,
  AGENT_CONFIG_SCHEMA,
  SYSTEM_CONFIG_SCHEMA,
  LEARNING_CONFIG_SCHEMA,
};
