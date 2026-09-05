'use strict';

const PermissionEvaluatorPolicy = require('@policy/permissions/permission-evaluator.policy');

describe('T142: Central Permission Evaluator Service', () => {
  test('evaluates default deny and allowed actions', () => {
    const evaluator = new PermissionEvaluatorPolicy({});

    const denyRes = evaluator.canExecuteAction({ action: 'EXECUTE_ACTION' });
    expect(denyRes.allowed).toBe(false);
    expect(denyRes.reason).toBe('DEFAULT_DENY_NO_ROLE');

    const allowRes = evaluator.canExecuteAction({ subjectRole: 'CEO', action: 'ANY_ACTION', resource: 'openclaw_orchestrator' });
    expect(allowRes.allowed).toBe(true);
  });
});
