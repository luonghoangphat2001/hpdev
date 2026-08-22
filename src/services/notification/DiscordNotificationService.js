'use strict';

const SEVERITIES = new Set([
  'info',
  'success',
  'warning',
  'critical',
]);

const ICONS = Object.freeze({
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  critical: '🚨',
});

class DiscordNotificationService {
  #repo;
  #configRepo;
  #discordClient = null;

  constructor(repo, configRepo) {
    this.#repo = repo;
    this.#configRepo = configRepo;
  }

  setDiscordClient(client) {
    this.#discordClient = client;
  }

  async enqueue(input) {
    const notification = this.#normalize(input);
    return this.#repo.enqueue(notification);
  }

  async deliverPending(limit = 20) {
    if (!this.#discordClient) {
      return {
        delivered: 0,
        failed: 0,
      };
    }

    const pending = await this.#repo.findPending(limit);
    let delivered = 0;
    let failed = 0;

    for (const notification of pending) {
      try {
        await this.#deliver(notification);
        await this.#repo.markSent(notification.id);
        delivered += 1;
      } catch (error) {
        await this.#repo.markFailed(notification.id, error.message);
        failed += 1;
      }
    }

    return {
      delivered,
      failed,
    };
  }

  #normalize(input = {}) {
    const idempotencyKey = String(input.idempotencyKey || '').trim();
    const title = String(input.title || '').trim();
    const message = String(input.message || '').trim();
    const severity = String(input.severity || 'info').toLowerCase();

    if (!idempotencyKey || idempotencyKey.length > 128) {
      throw new TypeError('idempotencyKey is required and must not exceed 128 characters');
    }
    if (!title || title.length > 255) {
      throw new TypeError('title is required and must not exceed 255 characters');
    }
    if (!message || message.length > 1800) {
      throw new TypeError('message is required and must not exceed 1800 characters');
    }
    if (!SEVERITIES.has(severity)) {
      throw new TypeError('severity must be info, success, warning, or critical');
    }

    return {
      idempotencyKey,
      title,
      message,
      severity,
      source: String(input.source || 'openclaw').trim().slice(0, 64),
      channelId: input.channelId ? String(input.channelId).trim().slice(0, 64) : null,
    };
  }

  async #deliver(notification) {
    const channelId = notification.channel_id ||
      this.#configRepo.get('openclaw_discord_channel_id') ||
      this.#configRepo.get('schedule_discord_channel_id');

    if (!channelId) {
      throw new Error('No Discord notification channel configured');
    }

    const channel = await this.#discordClient.channels.fetch(channelId).catch(() => {
      return null;
    });

    if (!channel?.isTextBased?.()) {
      throw new Error(`Discord channel ${channelId} is unavailable`);
    }

    const severity = SEVERITIES.has(notification.severity) ? notification.severity : 'info';
    await channel.send([
      `${ICONS[severity]} **${notification.title}**`,
      notification.message,
      `-# Nguồn: ${notification.source} · Mã: ${notification.idempotency_key}`,
    ].join('\n'));
  }
}

module.exports = DiscordNotificationService;
