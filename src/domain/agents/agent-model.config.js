'use strict';

// Runtime model assignment. Override with DAN_RND_MODEL=provider:model, etc.
const DEFAULT_MODEL = 'gemini:models/gemini-2.5-flash';
const DEFAULT_FALLBACK = 'claude:claude-sonnet-4-6';

function parse(value, fallback) {
  const raw = String(value || fallback).trim();
  const separator = raw.indexOf(':');
  if (separator <= 0 || separator === raw.length - 1) {
    throw new TypeError(`Invalid agent model configuration: ${raw}`);
  }
  return Object.freeze({ provider: raw.slice(0, separator), name: raw.slice(separator + 1) });
}

function forAgent(agentId) {
  const prefix = agentId.toUpperCase();
  return Object.freeze({
    primary: parse(process.env[`${prefix}_MODEL`], DEFAULT_MODEL),
    fallback: parse(process.env[`${prefix}_FALLBACK_MODEL`], DEFAULT_FALLBACK),
  });
}

const AGENT_MODELS = Object.freeze(Object.fromEntries(
  ['dan_rnd', 'dan_logistics', 'dan_cfo', 'dan_ops', 'dan_cskh']
    .map((id) => [id, forAgent(id)]),
));

module.exports = {
  AGENT_MODELS,
  getAgentModel: (agentId) => AGENT_MODELS[agentId] || null,
};
