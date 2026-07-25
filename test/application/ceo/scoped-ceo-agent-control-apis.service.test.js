'use strict';

const ScopedCeoAgentControlApisService = require('../../../src/application/services/ceo/scoped-ceo-agent-control-apis.service');

describe('T148: Scoped CEO/Agent Control APIs Service', () => {
  test('handles control request for authorized CEO role', () => {
    const mockEvaluator = { canExecuteAction: jest.fn().mockReturnValue({ allowed: true }) };
    const service = new ScopedCeoAgentControlApisService({ centralPermissionEvaluator: mockEvaluator });

    const res = service.handleControlRequest({
      userRole: 'CEO',
      scope: 'SECRET_ROTATION',
      action: 'ROTATE_KEY',
      payload: { key: 'OPS_KEY' },
    });

    expect(res.status).toBe('ACCEPTED');
    expect(res.auditId).toBeDefined();
  });
});
