'use strict';

class MemoryRepository {
  async upsert(_memory) {
    throw new Error('MemoryRepository.upsert must be implemented');
  }

  async findForScopes(_agentId, _scopes, _at, _limit) {
    throw new Error('MemoryRepository.findForScopes must be implemented');
  }
}

module.exports = MemoryRepository;
