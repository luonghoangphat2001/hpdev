'use strict';

class DataRetentionService {
  constructor({ retentionDays = 30 } = {}) {
    this.retentionDays = retentionDays;
  }

  isExpired(createdAt) {
    const created = new Date(createdAt).getTime();
    const cutoff = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);
    return created < cutoff;
  }
}

module.exports = DataRetentionService;
