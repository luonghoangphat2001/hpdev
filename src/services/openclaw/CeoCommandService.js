'use strict';

const COMMANDS = new Set([
  'goal.create',
  'portfolio.priority.change',
  'workflow.pause',
  'workflow.resume',
  'approval.approve',
  'approval.reject',
  'analysis.request',
]);

class CeoCommandService {
  constructor({
    openClawService,
    allowedUserIds,
    guildId = '',
    channelId = '',
  }) {
    this.openClawService = openClawService;
    this.allowedUserIds = new Set(allowedUserIds || []);
    this.guildId = String(guildId || '');
    this.channelId = String(channelId || '');
  }

  async execute({
    commandName,
    payloadJson,
    interactionId,
    userId,
    guildId,
    channelId,
  }) {
    this.#authorize({
      userId,
      guildId,
      channelId,
    });

    if (!COMMANDS.has(commandName)) {
      throw new TypeError('CEO command is not supported');
    }

    let payload;
    try {
      payload = JSON.parse(payloadJson || '{}');
    } catch (_error) {
      throw new TypeError('Payload phải là JSON hợp lệ.');
    }

    if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
      throw new TypeError('Payload phải là một JSON object.');
    }

    const response = await this.openClawService.executeCeoCommand(commandName, {
      actorId: String(userId),
      idempotencyKey: `discord:${interactionId}`,
      payload,
    });

    const receipt = response.receipt;
    const state = receipt.status === 'queued' ? 'đã xếp hàng' : 'đã hoàn tất';
    return `✅ \`${commandName}\` ${state}. Request: \`${receipt.requestId}\``;
  }

  #authorize({ userId, guildId, channelId }) {
    if (!this.allowedUserIds.has(String(userId))) {
      throw new Error('Chỉ CEO được phép dùng lệnh này.');
    }
    if (this.guildId && String(guildId) !== this.guildId) {
      throw new Error('Lệnh CEO không được phép trong server này.');
    }
    if (this.channelId && String(channelId) !== this.channelId) {
      throw new Error('Hãy dùng lệnh trong channel CEO đã cấu hình.');
    }
  }
}

module.exports = CeoCommandService;
module.exports.COMMANDS = COMMANDS;
