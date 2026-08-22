'use strict';

const ApprovalCommandService = require('../../src/services/openclaw/ApprovalCommandService');

describe('ApprovalCommandService', () => {
  const command = {
    approvalId: 'apr_123',
    decision: 'approve',
    decisionVersion: 1,
    reason: 'Đã kiểm tra',
    userId: 'ceo-1',
    guildId: 'guild-1',
    channelId: 'channel-1',
  };

  function build() {
    const openClawService = {
      decideApproval: jest.fn().mockResolvedValue({
        approval: {
          approval_id: 'apr_123',
          status: 'consumed',
          decision_version: 2,
        },
      }),
    };
    const service = new ApprovalCommandService({
      openClawService,
      allowedUserIds: ['ceo-1'],
      guildId: 'guild-1',
      channelId: 'channel-1',
    });
    return { service, openClawService };
  }

  test('forwards an authorized CEO decision with immutable Discord identity', async () => {
    const { service, openClawService } = build();

    await expect(service.decide(command))
      .resolves.toContain('apr_123');
    expect(openClawService.decideApproval).toHaveBeenCalledWith('apr_123', {
      decision: 'approve',
      decisionVersion: 1,
      actorId: 'ceo-1',
      reason: 'Đã kiểm tra',
    });
  });

  test.each([
    ['wrong user', { userId: 'agent-hr' }],
    ['wrong guild', { guildId: 'guild-public' }],
    ['wrong channel', { channelId: 'channel-public' }],
  ])('blocks %s before calling OpenClaw', async (_label, patch) => {
    const { service, openClawService } = build();

    await expect(service.decide({ ...command, ...patch }))
      .rejects.toMatchObject({ name: 'ApprovalAuthorizationError' });
    expect(openClawService.decideApproval).not.toHaveBeenCalled();
  });
});
