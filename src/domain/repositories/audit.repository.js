'use strict';

class AuditRepository {
  async append(_event) {
    throw new Error('AuditRepository.append must be implemented');
  }
}

module.exports = AuditRepository;
