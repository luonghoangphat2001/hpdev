'use strict';

const ActivityTransportService = require('@services/notification/realtime/activity-transport.service');

describe('T123: Realtime Activity Transport Service', () => {
  test('broadcasts activity events to subscribers', () => {
    const transport = new ActivityTransportService();
    const mockCallback = jest.fn();

    transport.subscribe(mockCallback);
    transport.broadcastActivity({ type: 'AGENT_TASK_STARTED', agent: 'dan_ops' });

    expect(mockCallback).toHaveBeenCalled();
    expect(mockCallback.mock.calls[0][0].agent).toBe('dan_ops');
  });
});
