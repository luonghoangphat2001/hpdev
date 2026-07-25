'use strict';

const MemoryPolicy = require('../../../domain/memory/memory-policy');

class ContextBuilderService {
  constructor({
    memoryRepository,
    memoryPolicy = new MemoryPolicy(),
    clock = () => new Date(),
    maxMemories = 100,
  }) {
    this.memoryRepository = memoryRepository;
    this.memoryPolicy = memoryPolicy;
    this.clock = clock;
    this.maxMemories = maxMemories;
  }

  async build({
    agentId,
    scopes,
    workflowContext = {},
    ssotContext = {},
  }) {
    if (!agentId || !Array.isArray(scopes) || scopes.length === 0) {
      throw new TypeError('Context requires agentId and at least one scope');
    }
    const at = this.clock();
    const rows = await this.memoryRepository.findForScopes(
      agentId,
      scopes,
      at,
      this.maxMemories,
    );
    const memories = rows
      .filter((memory) => this.memoryPolicy.isUsable(memory, { agentId, scopes, at }))
      .map((memory) => Object.freeze({
        key: memory.memory_key,
        value: this.memoryPolicy.redact(
          typeof memory.memory_value === 'string'
            ? JSON.parse(memory.memory_value)
            : memory.memory_value
        ),
        sourceRef: memory.source_ref,
        expiresAt: new Date(memory.expires_at).toISOString(),
      }));

    return Object.freeze({
      agentId,
      builtAt: at.toISOString(),
      workflow: Object.freeze(this.memoryPolicy.redact(workflowContext)),
      ssot: Object.freeze(this.memoryPolicy.redact(ssotContext)),
      memories: Object.freeze(memories),
    });
  }
}

module.exports = ContextBuilderService;
