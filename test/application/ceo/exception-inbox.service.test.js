'use strict';

const ExceptionInboxService =
  require('@services/ceo/exception/exception-inbox.service');

describe('ExceptionInboxService', () => {
  function build() {
    const repository = {
      collectApprovals: jest.fn().mockResolvedValue(2),
      collectDeadLetters: jest.fn().mockResolvedValue(1),
      collectConflicts: jest.fn().mockResolvedValue(3),
      collectKpiDeviations: jest.fn().mockResolvedValue(1),
      listOpen: jest.fn().mockResolvedValue([{ exception_id: 'exc_1' }]),
      acknowledge: jest.fn().mockResolvedValue(true),
    };
    const notificationGateway = { notify: jest.fn().mockResolvedValue({}) };
    const service = new ExceptionInboxService({
      repository,
      notificationGateway,
      allowedActorIds: ['ceo-1'],
      clock: () => new Date('2026-07-25T08:00:00Z'),
    });
    return { service, repository, notificationGateway };
  }

  test('collects all four exception sources into one inbox and sends one alert', async () => {
    const { service, notificationGateway } = build();
    await expect(service.refresh()).resolves.toEqual({
      added: 7,
      counts: {
        approval: 2,
        deadLetter: 1,
        conflict: 3,
        kpiDeviation: 1,
      },
    });
    expect(notificationGateway.notify).toHaveBeenCalledTimes(1);
    expect(notificationGateway.notify).toHaveBeenCalledWith(expect.objectContaining({
      severity: 'critical',
      message: expect.stringContaining('Dead-letter 1'),
    }));
  });

  test('lists open exceptions and only lets CEO acknowledge them', async () => {
    const { service, repository } = build();
    await expect(service.list(20)).resolves.toEqual([{ exception_id: 'exc_1' }]);
    expect(repository.listOpen).toHaveBeenCalledWith(20);
    await expect(service.acknowledge('exc_1', 'agent-hr'))
      .rejects.toMatchObject({ statusCode: 403 });
    await expect(service.acknowledge('exc_1', 'ceo-1')).resolves.toEqual({
      exceptionId: 'exc_1',
      status: 'acknowledged',
    });
  });
});
