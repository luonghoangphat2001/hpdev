'use strict';

class OutboxRepository {
  async claimNext(_workerId, _now, _leaseExpiresAt) {
    throw new Error('OutboxRepository.claimNext must be implemented');
  }

  async markDelivered(_jobId, _receipt, _deliveredAt) {
    throw new Error('OutboxRepository.markDelivered must be implemented');
  }

  async markRetry(_jobId, _failure, _availableAt) {
    throw new Error('OutboxRepository.markRetry must be implemented');
  }

  async markDead(_jobId, _failure) {
    throw new Error('OutboxRepository.markDead must be implemented');
  }

  async recoverExpiredLeases(_now) {
    throw new Error('OutboxRepository.recoverExpiredLeases must be implemented');
  }
}

module.exports = OutboxRepository;
