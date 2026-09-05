'use strict';

const DataRetentionPolicy = require('@policy/compliance/data-retention.policy');

describe('T085: Data Retention Service', () => {
  test('correctly identifies expired records past TTL', () => {
    const service = new DataRetentionPolicy({ retentionDays: 30 });
    const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const newDate = new Date().toISOString();

    expect(service.isExpired(oldDate)).toBe(true);
    expect(service.isExpired(newDate)).toBe(false);
  });
});
