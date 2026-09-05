'use strict';

const migration =
  require('@database/migrations/012-create-ceo-command-requests');

describe('012-create-ceo-command-requests migration', () => {
  test('stores durable idempotent CEO command receipts', () => {
    expect(migration.up).toContain('CREATE TABLE ceo_command_requests');
    expect(migration.up).toContain('UNIQUE KEY uq_ceo_command_idempotency');
    expect(migration.up).toContain('command_version');
    expect(migration.up).toContain('risk_level');
  });
});
