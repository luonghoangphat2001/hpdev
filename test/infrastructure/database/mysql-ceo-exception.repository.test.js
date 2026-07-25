'use strict';

const MysqlCeoExceptionRepository =
  require('../../../src/infrastructure/database/repositories/mysql-ceo-exception.repository');

describe('MysqlCeoExceptionRepository', () => {
  test('collectors use deduplicating inserts from each operational source', async () => {
    const executor = {
      execute: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
    };
    const repository = new MysqlCeoExceptionRepository(executor);
    await repository.collectApprovals();
    await repository.collectDeadLetters();
    await repository.collectConflicts();
    await repository.collectKpiDeviations();

    const sql = executor.execute.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql.match(/INSERT IGNORE INTO ceo_exceptions/g)).toHaveLength(4);
    expect(sql).toContain('FROM approval_requests');
    expect(sql).toContain('FROM dead_letters');
    expect(sql).toContain('FROM workflow_actions');
    expect(sql).toContain('FROM intelligence_traces');
  });
});
