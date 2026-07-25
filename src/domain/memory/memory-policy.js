'use strict';

const crypto = require('crypto');

const SCOPE_TTL_MS = Object.freeze({
  workflow: 7 * 24 * 60 * 60 * 1000,
  customer: 30 * 24 * 60 * 60 * 1000,
  agent: 90 * 24 * 60 * 60 * 1000,
});
const SENSITIVE_KEYS = /password|secret|token|authorization|cookie|card|cvv|email|phone|address/i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE = /(?:\+?84|0)(?:[\s.-]?\d){8,10}\b/g;

class MemoryPolicy {
  constructor({
    clock = () => new Date(),
    idFactory = () => `mem_${crypto.randomUUID()}`,
  } = {}) {
    this.clock = clock;
    this.idFactory = idFactory;
  }

  create({
    agentId,
    scopeType,
    scopeId,
    key,
    value,
    sourceRef,
    ttlMs = null,
  }) {
    if (!agentId || !scopeId || !key || !sourceRef) {
      throw new TypeError('Memory requires agentId, scopeId, key, and sourceRef');
    }
    const maxTtl = SCOPE_TTL_MS[scopeType];
    if (!maxTtl) throw new TypeError(`Unsupported memory scope: ${scopeType}`);
    const effectiveTtl = ttlMs === null ? maxTtl : Number(ttlMs);
    if (!Number.isFinite(effectiveTtl) || effectiveTtl <= 0 || effectiveTtl > maxTtl) {
      throw new TypeError(`Memory TTL exceeds policy for scope: ${scopeType}`);
    }
    const createdAt = this.clock();
    return Object.freeze({
      memoryId: this.idFactory(),
      agentId,
      scopeType,
      scopeId,
      key,
      value: this.redact(value),
      sourceRef,
      createdAt,
      expiresAt: new Date(createdAt.getTime() + effectiveTtl),
    });
  }

  redact(value) {
    if (Array.isArray(value)) return value.map((item) => this.redact(item));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [
        key,
        SENSITIVE_KEYS.test(key) ? '[REDACTED]' : this.redact(item),
      ]));
    }
    if (typeof value !== 'string') return value;
    return value.replace(EMAIL, '[REDACTED_EMAIL]').replace(PHONE, '[REDACTED_PHONE]');
  }

  isUsable(memory, { agentId, scopes, at = this.clock() }) {
    return memory.agent_id === agentId
      && scopes.some(({ type, id }) =>
        memory.scope_type === type && String(memory.scope_id) === String(id))
      && new Date(memory.expires_at).getTime() > at.getTime();
  }
}

module.exports = MemoryPolicy;
module.exports.SCOPE_TTL_MS = SCOPE_TTL_MS;
