'use strict';

const catalog = require('../../src/contracts/commands/ceo-command.catalog');
const CeoCommandDispatcherService =
  require('../../src/application/services/ceo-command-dispatcher.service');

describe('CEO command catalog', () => {
  test('contains every required CEO operation with version, permission and risk', () => {
    expect(catalog.list().map(({ name }) => name)).toEqual([
      'goal.create',
      'portfolio.priority.change',
      'workflow.pause',
      'workflow.resume',
      'approval.approve',
      'approval.reject',
      'analysis.request',
    ]);
    catalog.list().forEach((command) => {
      expect(command).toEqual(expect.objectContaining({
        version: '1.0.0',
        permission: expect.any(String),
        risk: expect.stringMatching(/^(low|medium|high|critical)$/),
        inputSchema: expect.objectContaining({ additionalProperties: false }),
      }));
    });
  });

  test('dispatches only validated commands from an allowlisted CEO', async () => {
    const handler = jest.fn().mockResolvedValue({ goalId: 'gol_1' });
    const dispatcher = new CeoCommandDispatcherService({
      handlers: { 'goal.create': handler },
      allowedActorIds: ['ceo-1'],
    });
    const payload = {
      horizon: 'year',
      title: 'Grow',
      ownerType: 'ceo',
      ownerId: 'ceo-1',
      target: { metric: 'revenue', value: 100 },
      startsAt: '2026-01-01T00:00:00Z',
      deadlineAt: '2026-12-31T00:00:00Z',
    };
    await expect(dispatcher.dispatch({
      commandName: 'goal.create',
      payload,
      actorId: 'ceo-1',
      idempotencyKey: 'ceo:goal:1',
    })).resolves.toMatchObject({
      command: 'goal.create',
      version: '1.0.0',
      status: 'completed',
    });
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      actorId: 'ceo-1',
      commandVersion: '1.0.0',
    }));
  });

  test('blocks unknown actors and invalid payloads before handlers', async () => {
    const handler = jest.fn();
    const dispatcher = new CeoCommandDispatcherService({
      handlers: { 'analysis.request': handler },
      allowedActorIds: ['ceo-1'],
    });
    await expect(dispatcher.dispatch({
      commandName: 'analysis.request',
      payload: { question: 'Analyze revenue' },
      actorId: 'agent-hr',
      idempotencyKey: 'ceo:analysis:1',
    })).rejects.toMatchObject({ statusCode: 403 });
    await expect(dispatcher.dispatch({
      commandName: 'analysis.request',
      payload: { question: '' },
      actorId: 'ceo-1',
      idempotencyKey: 'ceo:analysis:2',
    })).rejects.toMatchObject({ statusCode: 422 });
    expect(handler).not.toHaveBeenCalled();
  });

  test('returns the durable receipt without executing an idempotent replay', async () => {
    const handler = jest.fn();
    const requestRepository = {
      findByIdempotencyKey: jest.fn().mockResolvedValue({
        request_id: 'cmd_1',
        command_name: 'analysis.request',
        command_version: '1.0.0',
        status: 'queued',
        result: JSON.stringify({ status: 'queued' }),
      }),
    };
    const dispatcher = new CeoCommandDispatcherService({
      handlers: { 'analysis.request': handler },
      allowedActorIds: ['ceo-1'],
      requestRepository,
    });

    await expect(dispatcher.dispatch({
      commandName: 'analysis.request',
      payload: { question: 'Analyze revenue' },
      actorId: 'ceo-1',
      idempotencyKey: 'ceo:analysis:replay',
    })).resolves.toMatchObject({
      requestId: 'cmd_1',
      status: 'queued',
      duplicate: true,
    });
    expect(handler).not.toHaveBeenCalled();
  });
});
