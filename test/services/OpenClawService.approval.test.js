'use strict';

const OpenClawService = require('../../src/services/openclaw/OpenClawService');

describe('OpenClawService approval API', () => {
  test('posts a versioned CEO decision using the OpenClaw Bearer secret', async () => {
    const httpClient = {
      post: jest.fn().mockResolvedValue({
        data: { ok: true, approval: { status: 'consumed' } },
      }),
    };
    const service = new OpenClawService(
      'https://openclaw.example',
      'openclaw-secret',
      9000,
      httpClient
    );

    await service.decideApproval('apr/1', {
      decision: 'approve',
      decisionVersion: 2,
      actorId: 'ceo-1',
      reason: 'ok',
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      'https://openclaw.example/orchestrator/v1/approvals/apr%2F1/decision',
      {
        decision: 'approve',
        decisionVersion: 2,
        actorId: 'ceo-1',
        reason: 'ok',
      },
      {
        headers: { Authorization: 'Bearer openclaw-secret' },
        timeout: 9000,
      }
    );
  });

  test('posts a durable CEO command to its versioned endpoint', async () => {
    const httpClient = {
      post: jest.fn().mockResolvedValue({
        data: { ok: true, receipt: { requestId: 'cmd_1' } },
      }),
    };
    const service = new OpenClawService(
      'https://openclaw.example',
      'openclaw-secret',
      9000,
      httpClient
    );

    await service.executeCeoCommand('analysis.request', {
      actorId: 'ceo-1',
      idempotencyKey: 'discord:1',
      payload: { question: 'Analyze revenue' },
    });

    expect(httpClient.post).toHaveBeenCalledWith(
      'https://openclaw.example/orchestrator/v1/commands/analysis.request',
      {
        actorId: 'ceo-1',
        idempotencyKey: 'discord:1',
        payload: { question: 'Analyze revenue' },
      },
      {
        headers: { Authorization: 'Bearer openclaw-secret' },
        timeout: 9000,
      }
    );
  });
});
