/**
 * @fileoverview agent-model.config - Provides agent-model.config functionality.
 */
'use strict';

function parse(value, envKey) {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`Model configuration ${envKey} is required in environment`);
  }
  const target = value.trim();
  const separator = target.indexOf(':');
  if (separator <= 0 || separator === target.length - 1) {
    throw new TypeError(`Invalid agent model configuration: ${target}`);
  }
  return Object.freeze({ provider: target.slice(0, separator), name: target.slice(separator + 1) });
}

function forAgent(agentId) {
  const prefix = agentId.toUpperCase();
  const primaryKey = `${prefix}_MODEL`;
  const fallbackKey = `${prefix}_FALLBACK_MODEL`;
  const primaryVal = process.env[primaryKey];
  const fallbackVal = process.env[fallbackKey];

  if (!primaryVal) {
    throw new Error(`[agent-model.config] Missing required environment variable: ${primaryKey}`);
  }
  if (!fallbackVal) {
    throw new Error(`[agent-model.config] Missing required environment variable: ${fallbackKey}`);
  }

  return Object.freeze({
    primary: parse(primaryVal, primaryKey),
    fallback: parse(fallbackVal, fallbackKey),
  });
}

const AGENT_MODELS = Object.freeze(Object.fromEntries(
  ['dan_rnd', 'dan_logistics', 'dan_cfo', 'dan_ops', 'dan_cskh']
    .map((id) => [id, forAgent(id)]),
));

module.exports = {
  AGENT_MODELS,
  getAgentModel: (agentId) => {
    if (AGENT_MODELS[agentId] !== undefined) {
      return AGENT_MODELS[agentId];
    }
    return null;
  },
};
