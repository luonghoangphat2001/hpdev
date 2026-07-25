'use strict';

const migration = require('../../../src/infrastructure/database/migrations/016-create-sop-playbooks');
const MysqlSopRepository = require('../../../src/infrastructure/database/repositories/mysql-sop.repository');

describe('T060: Versioned SOP Store and Migration', () => {
  test('migration exports valid up and down statements', () => {
    expect(migration.id).toBe('016-create-sop-playbooks');
    expect(migration.up).toContain('CREATE TABLE sop_playbooks');
    expect(migration.up).toContain('CREATE TABLE sop_versions');
    expect(migration.down).toContain('DROP TABLE IF EXISTS sop_versions');
  });

  test('mysql sop repository workflow', async () => {
    const mockExecutor = {
      execute: jest.fn(),
    };
    const repo = new MysqlSopRepository(mockExecutor);

    // createPlaybook
    mockExecutor.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await repo.createPlaybook({ sopId: 'sop-1', name: 'Standard Order SOP', ownerAgentId: 'dan_ops' });
    expect(mockExecutor.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO sop_playbooks'),
      ['sop-1', 'Standard Order SOP', 'dan_ops']
    );

    // nextVersion
    mockExecutor.execute.mockResolvedValueOnce([[{ next_version: '1' }]]);
    const v = await repo.nextVersion('sop-1');
    expect(v).toBe(1);

    // createVersion
    mockExecutor.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await repo.createVersion({
      sopId: 'sop-1',
      version: 1,
      definition: { name: 'Step 1', steps: [] },
      definitionHash: 'hash123',
      effectiveAt: '2026-07-25T00:00:00Z',
      createdBy: 'ceo',
    });
    expect(mockExecutor.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO sop_versions'),
      expect.arrayContaining(['sop-1', 1])
    );
  });
});
