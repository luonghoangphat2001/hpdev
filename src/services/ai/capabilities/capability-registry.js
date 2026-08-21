/**
 * @fileoverview capability-registry - Provides capability-registry functionality.
 */
'use strict';

const KINDS = Object.freeze(['agent', 'tool', 'model']);

/**
 * CapabilityRegistry
 * Manages capability registry logic.
 */
class CapabilityRegistry {
  /**
   * constructor - Executes constructor.
   * @param {*} entries - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(entries = []) {
    this.entries = new Map();
    entries.forEach((entry) => this.register(entry));
  }

  /**
   * register - Executes register.
   * @param {*} entry - Input parameter.
   * @returns {*} Result of operation.
   */
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

  /**
   * get - Executes get.
   * @param {*} kind - Input parameter.
   * @param {*} id - Input parameter.
   * @returns {*} Result of operation.
   */
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
