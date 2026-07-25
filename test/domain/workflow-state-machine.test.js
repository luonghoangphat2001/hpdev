'use strict';

const stateMachine = require('../../src/domain/workflows/workflow-state-machine');
const { InvalidWorkflowTransitionError } = require('../../src/domain/workflows/workflow-state-machine');
const WorkflowTransitionService = require('../../src/application/services/workflow-transition.service');

describe('WorkflowStateMachine', () => {
  it('allows only declared workflow transitions', () => {
    expect(stateMachine.canTransition('received', 'queued')).toBe(true);
    expect(stateMachine.canTransition('running', 'awaiting_approval')).toBe(true);
    expect(stateMachine.canTransition('failed', 'queued')).toBe(true);
    expect(stateMachine.canTransition('completed', 'running')).toBe(false);
    expect(stateMachine.canTransition('unknown', 'queued')).toBe(false);
  });

  it('treats completed and cancelled as terminal', () => {
    expect(stateMachine.isTerminal('completed')).toBe(true);
    expect(stateMachine.isTerminal('cancelled')).toBe(true);
    expect(stateMachine.isTerminal('failed')).toBe(false);
  });

  it('raises a domain error for invalid transitions', () => {
    expect(() => stateMachine.assertTransition('received', 'completed'))
      .toThrow(InvalidWorkflowTransitionError);
  });
});

describe('WorkflowTransitionService', () => {
  it('updates workflow and appends audit inside one transaction', async () => {
    const workflows = {
      findByWorkflowId: jest.fn().mockResolvedValue({
        workflow_id: 'wf_1',
        event_id: 'evt_1',
        correlation_id: 'cor_1',
        state: 'queued',
        policy_version: '1.0.0',
      }),
      transition: jest.fn().mockResolvedValue({
        workflow_id: 'wf_1',
        state: 'running',
        state_version: 2,
      }),
    };
    const audits = { append: jest.fn().mockResolvedValue({ auditId: 'evt_audit' }) };
    const connection = {};
    const service = new WorkflowTransitionService({
      transactionManager: {
        execute: (operation) => operation(connection),
      },
      workflowRepositoryFactory: (executor) => {
        expect(executor).toBe(connection);
        return workflows;
      },
      auditRepositoryFactory: () => audits,
      idFactory: { createId: () => 'aud_1' },
      clock: () => new Date('2026-07-25T00:00:00.000Z'),
    });

    await expect(service.transition({
      workflowId: 'wf_1',
      expectedVersion: 1,
      toState: 'running',
      actorType: 'service',
      actorId: 'openclaw',
      reason: 'worker_claimed',
    })).resolves.toMatchObject({ state: 'running', state_version: 2 });

    expect(workflows.transition).toHaveBeenCalledWith('wf_1', 1, {
      state: 'running',
      failureCode: null,
      failureReason: null,
      completedAt: null,
    });
    expect(audits.append).toHaveBeenCalledWith(expect.objectContaining({
      auditType: 'workflow.state_changed',
      fromState: 'queued',
      toState: 'running',
    }));
  });

  it('does not update or audit an invalid transition', async () => {
    const workflows = {
      findByWorkflowId: jest.fn().mockResolvedValue({
        workflow_id: 'wf_1',
        state: 'completed',
      }),
      transition: jest.fn(),
    };
    const audits = { append: jest.fn() };
    const service = new WorkflowTransitionService({
      transactionManager: { execute: (operation) => operation({}) },
      workflowRepositoryFactory: () => workflows,
      auditRepositoryFactory: () => audits,
    });

    await expect(service.transition({
      workflowId: 'wf_1',
      expectedVersion: 2,
      toState: 'running',
      actorType: 'service',
      actorId: 'openclaw',
    })).rejects.toBeInstanceOf(InvalidWorkflowTransitionError);
    expect(workflows.transition).not.toHaveBeenCalled();
    expect(audits.append).not.toHaveBeenCalled();
  });
});
