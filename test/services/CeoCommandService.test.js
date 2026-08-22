'use strict';

const CeoCommandService = require('../../src/services/openclaw/CeoCommandService');

describe('CeoCommandService', () => {
  function build() {
    const openClawService = {
      executeCeoCommand: jest.fn().mockResolvedValue({
        receipt: { requestId: 'cmd_1', status: 'queued' },
      }),
    };
    const service = new CeoCommandService({
      openClawService,
      allowedUserIds: ['ceo-1'],
      guildId: 'guild-1',
      channelId: 'channel-1',
    });
    return { service, openClawService };
  }

  const input = {
    commandName: 'analysis.request',
    payloadJson: '{"question":"Analyze weekly revenue"}',
    interactionId: 'interaction-99',
    userId: 'ceo-1',
    guildId: 'guild-1',
    channelId: 'channel-1',
  };

  test('uses Discord interaction ID as the durable idempotency key', async () => {
    const { service, openClawService } = build();
    await expect(service.execute(input)).resolves.toContain('đã xếp hàng');
    expect(openClawService.executeCeoCommand).toHaveBeenCalledWith(
      'analysis.request',
      {
        actorId: 'ceo-1',
        idempotencyKey: 'discord:interaction-99',
        payload: { question: 'Analyze weekly revenue' },
      }
    );
  });

  test.each([
    ['user', { userId: 'agent-hr' }],
    ['guild', { guildId: 'other' }],
    ['channel', { channelId: 'public' }],
  ])('blocks the wrong CEO %s boundary', async (_label, patch) => {
    const { service, openClawService } = build();
    await expect(service.execute({ ...input, ...patch })).rejects.toThrow();
    expect(openClawService.executeCeoCommand).not.toHaveBeenCalled();
  });

  test('rejects malformed JSON before calling OpenClaw', async () => {
    const { service, openClawService } = build();
    await expect(service.execute({ ...input, payloadJson: '{bad' }))
      .rejects.toThrow('JSON hợp lệ');
    expect(openClawService.executeCeoCommand).not.toHaveBeenCalled();
  });
});
