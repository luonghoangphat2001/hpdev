/**
 * @fileoverview identity.policy - Provides identity functionality.
 */
'use strict';

const IDENTITY_POLICY_VERSION = '1.0.0';

const SYSTEM_IDENTITIES = Object.freeze({
  ecommerce: Object.freeze({
    role: 'business_ssot',
    owns: Object.freeze(['business_data', 'agent_accounts', 'webhook_registrations']),
    mayWriteBusinessState: true,
  }),
  openclaw: Object.freeze({
    role: 'orchestrator_control_plane',
    owns: Object.freeze(['workflow_state', 'approvals', 'audit', 'agent_memory']),
    mayWriteBusinessState: false,
  }),
  dan_ai: Object.freeze({
    role: 'ceo_interface',
    owns: Object.freeze(['discord_session', 'ceo_dashboard_session']),
    mayWriteBusinessState: false,
  }),
});

const SECRET_OWNERSHIP = Object.freeze([
  Object.freeze({
    name: 'ecommerce_webhook_secret',
    issuer: 'ecommerce',
    holders: Object.freeze(['ecommerce', 'openclaw']),
    openclawEnv: 'ECOMMERCE_WEBHOOK_SECRET',
  }),
  Object.freeze({
    name: 'ecommerce_agent_token',
    issuer: 'ecommerce',
    holders: Object.freeze(['ecommerce', 'openclaw']),
    openclawEnv: 'ECOMMERCE_AGENT_TOKEN',
  }),
  Object.freeze({
    name: 'openclaw_api_secret',
    issuer: 'openclaw',
    holders: Object.freeze(['openclaw', 'dan_ai']),
    openclawEnv: 'API_SECRET',
    danAiEnv: 'OPENCLAW_SECRET',
  }),
  Object.freeze({
    name: 'dan_ai_api_secret',
    issuer: 'dan_ai',
    holders: Object.freeze(['dan_ai', 'openclaw']),
    openclawEnv: 'DAN_AI_API_SECRET',
  }),
  Object.freeze({
    name: 'discord_bot_token',
    issuer: 'discord',
    holders: Object.freeze(['dan_ai']),
    danAiEnv: 'DISCORD_TOKEN',
  }),
]);

const TRUST_FLOWS = Object.freeze([
  Object.freeze({
    name: 'ecommerce_to_openclaw',
    caller: 'ecommerce',
    callee: 'openclaw',
    authentication: 'hmac_sha256',
    credential: 'ecommerce_webhook_secret',
  }),
  Object.freeze({
    name: 'openclaw_to_ecommerce',
    caller: 'openclaw',
    callee: 'ecommerce',
    authentication: 'agent_bearer_and_code',
    credential: 'ecommerce_agent_token',
    serviceAccountEnv: 'ECOMMERCE_AGENT_CODE',
  }),
  Object.freeze({
    name: 'dan_ai_to_openclaw',
    caller: 'dan_ai',
    callee: 'openclaw',
    authentication: 'bearer',
    credential: 'openclaw_api_secret',
  }),
  Object.freeze({
    name: 'openclaw_to_dan_ai',
    caller: 'openclaw',
    callee: 'dan_ai',
    authentication: 'bearer',
    credential: 'dan_ai_api_secret',
  }),
  Object.freeze({
    name: 'ceo_to_dan_ai',
    caller: 'ceo',
    callee: 'dan_ai',
    authentication: 'discord_identity_allowlist',
    requiredConfig: Object.freeze([
      'CEO_DISCORD_USER_ID',
      'DISCORD_GUILD_ID',
      'CEO_DISCORD_CHANNEL_ID',
    ]),
  }),
]);

/**
 * IdentityPolicy
 * Manages identity policy logic.
 */
class IdentityPolicy {
  constructor({
    systems = SYSTEM_IDENTITIES,
    secrets = SECRET_OWNERSHIP,
    flows = TRUST_FLOWS,
  } = {}) {
    this.systems = systems;
    this.secrets = secrets;
    this.flows = flows;
    this.validate();
  }

  /**
   * validate - Executes validate.
   * @returns {*} Result of operation.
   */
  validate() {
    const knownSystems = new Set([...Object.keys(this.systems), 'ceo', 'discord']);
    const secretNames = new Set(this.secrets.map(({ name }) => name));

    this.flows.forEach((flow) => {
      if (!knownSystems.has(flow.caller) || !knownSystems.has(flow.callee)) {
        throw new TypeError(`Unknown trust boundary in flow: ${flow.name}`);
      }
      if (flow.credential && !secretNames.has(flow.credential)) {
        throw new TypeError(`Unknown credential in flow: ${flow.name}`);
      }
    });
  }

  /**
   * getFlow - Executes get flow.
   * @param {*} name - Input parameter.
   * @returns {*} Result of operation.
   */
  getFlow(name) {
    return this.flows.find((flow) => flow.name === name) || null;
  }

  /**
   * getSecret - Executes get secret.
   * @param {*} name - Input parameter.
   * @returns {*} Result of operation.
   */
  getSecret(name) {
    return this.secrets.find((secret) => secret.name === name) || null;
  }

  /**
   * canWriteBusinessState - Executes can write business state.
   * @param {*} system - Input parameter.
   * @returns {*} Result of operation.
   */
  canWriteBusinessState(system) {
    return this.systems[system]?.mayWriteBusinessState === true;
  }
}

module.exports = new IdentityPolicy();
module.exports.IdentityPolicy = IdentityPolicy;
module.exports.SYSTEM_IDENTITIES = SYSTEM_IDENTITIES;
module.exports.SECRET_OWNERSHIP = SECRET_OWNERSHIP;
module.exports.TRUST_FLOWS = TRUST_FLOWS;
module.exports.IDENTITY_POLICY_VERSION = IDENTITY_POLICY_VERSION;
