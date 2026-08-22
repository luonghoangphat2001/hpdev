'use strict';

/**
 * CEO authorization and presentation boundary for Discord approval commands.
 */
class ApprovalCommandService {
  #openClaw;
  #allowedUserIds;
  #guildId;
  #channelId;

  constructor({
    openClawService,
    allowedUserIds,
    guildId = '',
    channelId = '',
  }) {
    this.#openClaw = openClawService;
    this.#allowedUserIds = new Set(allowedUserIds || []);
    this.#guildId = String(guildId || '');
    this.#channelId = String(channelId || '');
  }

  async decide({
    approvalId,
    decision,
    decisionVersion,
    reason,
    userId,
    guildId,
    channelId,
  }) {
    this.#authorize({
      userId,
      guildId,
      channelId,
    });

    const result = await this.#openClaw.decideApproval(approvalId, {
      decision,
      decisionVersion,
      actorId: String(userId),
      reason: reason || null,
    });

    const approval = result.approval;
    const label = approval.status === 'consumed' ? 'đã duyệt' : 'đã từ chối';
    return `✅ Approval \`${approval.approval_id}\` ${label} (version ${approval.decision_version}).`;
  }

  #authorize({ userId, guildId, channelId }) {
    if (!this.#allowedUserIds.has(String(userId))) {
      throw new ApprovalAuthorizationError('Chỉ CEO được phép duyệt tác vụ.');
    }
    if (this.#guildId && String(guildId) !== this.#guildId) {
      throw new ApprovalAuthorizationError('Lệnh duyệt không được phép trong server này.');
    }
    if (this.#channelId && String(channelId) !== this.#channelId) {
      throw new ApprovalAuthorizationError('Hãy dùng lệnh duyệt trong channel CEO đã cấu hình.');
    }
  }
}

class ApprovalAuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApprovalAuthorizationError';
  }
}

module.exports = ApprovalCommandService;
module.exports.ApprovalAuthorizationError = ApprovalAuthorizationError;
