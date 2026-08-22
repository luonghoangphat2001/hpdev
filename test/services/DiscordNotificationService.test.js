'use strict';

const DiscordNotificationService = require('../../src/services/notification/DiscordNotificationService');

describe('DiscordNotificationService', () => {
  let repo;
  let configRepo;
  let service;

  beforeEach(() => {
    repo = {
      enqueue: jest.fn().mockResolvedValue({ id: 7, duplicate: false }),
      findPending: jest.fn().mockResolvedValue([]),
      markSent: jest.fn(),
      markFailed: jest.fn(),
    };
    configRepo = { get: jest.fn().mockReturnValue('channel-default') };
    service = new DiscordNotificationService(repo, configRepo);
  });

  test('normalizes and queues a valid OpenClaw notification', async () => {
    await expect(service.enqueue({
      idempotencyKey: 'workflow-42:approval',
      title: 'Cần CEO duyệt',
      message: 'Đề xuất hoàn tiền đơn #42',
      severity: 'warning',
    })).resolves.toEqual({ id: 7, duplicate: false });

    expect(repo.enqueue).toHaveBeenCalledWith({
      idempotencyKey: 'workflow-42:approval',
      title: 'Cần CEO duyệt',
      message: 'Đề xuất hoàn tiền đơn #42',
      severity: 'warning',
      source: 'openclaw',
      channelId: null,
    });
  });

  test('rejects malformed notifications before persistence', async () => {
    await expect(service.enqueue({ title: 'Missing fields' }))
      .rejects.toThrow('idempotencyKey is required');
    expect(repo.enqueue).not.toHaveBeenCalled();
  });

  test('delivers pending notifications through the injected Discord client', async () => {
    repo.findPending.mockResolvedValue([{
      id: 9,
      idempotency_key: 'daily:cfo:2026-07-25',
      source: 'openclaw',
      severity: 'success',
      title: 'CFO hoàn tất báo cáo',
      message: 'Không phát hiện sai lệch.',
      channel_id: null,
    }]);
    const send = jest.fn().mockResolvedValue(undefined);
    const client = {
      channels: {
        fetch: jest.fn().mockResolvedValue({ isTextBased: () => true, send }),
      },
    };
    service.setDiscordClient(client);

    await expect(service.deliverPending()).resolves.toEqual({ delivered: 1, failed: 0 });
    expect(client.channels.fetch).toHaveBeenCalledWith('channel-default');
    expect(send).toHaveBeenCalledWith(expect.stringContaining('CFO hoàn tất báo cáo'));
    expect(repo.markSent).toHaveBeenCalledWith(9);
  });

  test('records delivery failures without throwing away the queue item', async () => {
    repo.findPending.mockResolvedValue([{
      id: 10,
      idempotency_key: 'alert:10',
      source: 'openclaw',
      severity: 'critical',
      title: 'Lỗi',
      message: 'Không thể hoàn tất workflow.',
      channel_id: 'missing',
    }]);
    service.setDiscordClient({
      channels: { fetch: jest.fn().mockResolvedValue(null) },
    });

    await expect(service.deliverPending()).resolves.toEqual({ delivered: 0, failed: 1 });
    expect(repo.markFailed).toHaveBeenCalledWith(10, 'Discord channel missing is unavailable');
  });
});
