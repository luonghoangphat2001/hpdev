'use strict';

const RealtimeStreamService = require('../../../src/services/notification/realtime/realtime-stream.service');

describe('T163: Authorized Realtime Stream API Service', () => {
  test('creates streaming session for authorized CEO role with cursor and redaction', () => {
    const mockEvaluator = { canExecuteAction: jest.fn().mockReturnValue({ allowed: true }) };
    const service = new RealtimeStreamService({ centralPermissionEvaluator: mockEvaluator });

    const session = service.createStreamSession({ userRole: 'CEO', agentId: 'dan_cfo', cursor: '100' });
    expect(session.status).toBe('STREAM_CONNECTED');
    expect(session.redactionActive).toBe(true);
    expect(session.cursor).toBe('100');
  });
});
