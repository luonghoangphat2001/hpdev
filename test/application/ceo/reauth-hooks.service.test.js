'use strict';

const ReauthHooksService = require('@services/ceo/command/reauth-hooks.service');

describe('T149: CEO Re-Auth, Confirmation, and Dual-Control Hooks Service', () => {
  test('executes dangerous action upon valid re-authentication', () => {
    const service = new ReauthHooksService();
    const res = service.executeDangerousAction({
      sessionToken: 'ceo_secret_token_123',
      reauthCode: '123456',
      action: 'GLOBAL_EMERGENCY_STOP',
      reason: 'Anomaly detected',
    });

    expect(res.status).toBe('APPROVED_AND_EXECUTED');
    expect(res.reauthenticated).toBe(true);
  });

  test('throws error when re-authentication fails', () => {
    const service = new ReauthHooksService();
    expect(() => service.executeDangerousAction({
      sessionToken: 'ceo_secret_token_123',
      reauthCode: '000000',
      action: 'GLOBAL_EMERGENCY_STOP',
    })).toThrow('CEO re-authentication failed');
  });
});
