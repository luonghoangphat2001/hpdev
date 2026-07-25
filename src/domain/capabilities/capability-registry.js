'use strict';

const KINDS = Object.freeze(['agent', 'tool', 'model']);

class CapabilityRegistry {
  constructor(entries = []) {
    this.entries = new Map();
    entries.forEach((entry) => this.register(entry));
  }

  register(entry) {
    if (!KINDS.includes(entry?.kind) || !entry?.id || !entry?.version) {
      throw new TypeError('Capability entry requires valid kind, id, and version');
    }
    const key = `${entry.kind}:${entry.id}`;
    if (this.entries.has(key)) throw new TypeError(`Duplicate capability entry: ${key}`);
    this.entries.set(key, Object.freeze({
      ...entry,
      capabilities: Object.freeze([...(entry.capabilities || [])]),
      permissions: Object.freeze([...(entry.permissions || [])]),
      metadata: Object.freeze({ ...(entry.metadata || {}) }),
    }));
  }

  get(kind, id) {
    return this.entries.get(`${kind}:${id}`) || null;
  }

  query({
    kind = null,
    capability = null,
    permission = null,
    available = null,
  } = {}) {
    return Array.from(this.entries.values()).filter((entry) =>
      (!kind || entry.kind === kind)
      && (!capability || entry.capabilities.includes(capability))
      && (!permission || entry.permissions.includes(permission))
      && (available === null || entry.available === available));
  }
}

module.exports = CapabilityRegistry;
module.exports.KINDS = KINDS;
