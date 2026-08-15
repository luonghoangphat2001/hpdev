'use strict';

const CapabilityRegistry = require('../domain/capabilities/capability-registry');
const agentRegistry = require('../domain/agents/agent-registry');
const actionCatalog = require('../contracts/actions/ecommerce-action.catalog');
const { ACTION_CATALOG_VERSION } = require('../contracts/actions/ecommerce-action.catalog');

const LOGICAL_MODELS = Object.freeze([
  Object.freeze({
    id: 'fast',
    version: '1.0.0',
    capabilities: Object.freeze(['classification', 'extraction', 'summarization']),
    permissions: Object.freeze(['read_context']),
    metadata: Object.freeze({ costTier: 'low', latencyTier: 'low' }),
  }),
  Object.freeze({
    id: 'reasoning',
    version: '1.0.0',
    capabilities: Object.freeze(['planning', 'decomposition', 'critique']),
    permissions: Object.freeze(['read_context', 'create_proposal']),
    metadata: Object.freeze({ costTier: 'high', latencyTier: 'high' }),
  }),
  Object.freeze({
    id: 'balanced',
    version: '1.0.0',
    capabilities: Object.freeze([
      'classification', 'extraction', 'summarization',
      'planning', 'decomposition', 'critique',
    ]),
    permissions: Object.freeze(['read_context', 'create_proposal']),
    metadata: Object.freeze({ costTier: 'medium', latencyTier: 'medium' }),
  }),
]);

function buildCapabilityRegistry({
  agents = agentRegistry.list(),
  tools = actionCatalog.list(),
  models = LOGICAL_MODELS,
} = {}) {
  const entries = [
    ...agents.map((agent) => ({
      kind: 'agent',
      id: agent.id,
      version: agent.version,
      capabilities: agent.capabilities,
      permissions: agent.permissions,
      available: true,
      metadata: {
        department: agent.department,
        mission: agent.mission,
        scope: agent.scope,
        kpis: agent.kpis,
        prohibitions: agent.prohibitions,
        escalationOwner: agent.escalationOwner,
        model: agent.model || null,
        eventPatterns: agent.eventPatterns,
        actionPatterns: agent.actionPatterns,
      },
    })),
    ...tools.map((tool) => ({
      kind: 'tool',
      id: tool.name,
      version: tool.catalogVersion || ACTION_CATALOG_VERSION,
      capabilities: [tool.method === 'GET' ? 'read_ssot' : 'write_ssot'],
      permissions: [tool.permission],
      available: tool.availability === 'implemented',
      metadata: {
        method: tool.method,
        endpoint: tool.endpoint,
        availability: tool.availability,
      },
    })),
    ...models.map((model) => ({
      kind: 'model',
      ...model,
      available: true,
    })),
  ];
  return new CapabilityRegistry(entries);
}

module.exports = {
  buildCapabilityRegistry,
  LOGICAL_MODELS,
};
