'use strict';

const OrchestrationLoggerService = require('../../../src/application/services/observability/orchestration-logger.service');

describe('OrchestrationLoggerService', () => {
  const clock = () => new Date('2026-07-25T00:00:00.000Z');

  it('writes a complete event-to-receipt lineage', () => {
    const sink = { write: jest.fn() };
    const log = new OrchestrationLoggerService({ sink, clock });
    const lineage = {
      event_id: 'evt_1',
      workflow_id: 'wf_1',
      agent_id: 'dan_ops',
      action_id: 'act_1',
      correlation_id: 'cor_1',
      receipt_id: 'receipt_1',
    };

    expect(log.info('receipt', 'SSOT action delivered', lineage)).toMatchObject({
      timestamp: '2026-07-25T00:00:00.000Z',
      level: 'info',
      stage: 'receipt',
      ...lineage,
    });
    expect(sink.write).toHaveBeenCalledWith(
      'info',
      'SSOT action delivered',
      expect.objectContaining(lineage),
    );
  });

  it('inherits correlation context through child loggers', () => {
    const sink = { write: jest.fn() };
    const root = new OrchestrationLoggerService({
      sink,
      clock,
      baseContext: {
        event_id: 'evt_1',
        correlation_id: 'cor_1',
      },
    });
    const workflow = root.child({ workflow_id: 'wf_1' });

    expect(() => workflow.info('workflow', 'queued')).not.toThrow();
    expect(sink.write).toHaveBeenCalledWith(
      'info',
      'queued',
      expect.objectContaining({
        event_id: 'evt_1',
        workflow_id: 'wf_1',
        correlation_id: 'cor_1',
      }),
    );
  });

  it('rejects incomplete lineage instead of writing misleading traces', () => {
    const sink = { write: jest.fn() };
    const log = new OrchestrationLoggerService({ sink, clock });

    expect(() => log.info('action', 'executing', {
      event_id: 'evt_1',
      workflow_id: 'wf_1',
    })).toThrow('Missing action lineage fields');
    expect(sink.write).not.toHaveBeenCalled();
  });

  it('keeps required structured fields present even when nullable', () => {
    const sink = { write: jest.fn() };
    const log = new OrchestrationLoggerService({ sink, clock });
    const entry = log.error('event', 'event failed', {
      event_id: 'evt_1',
      correlation_id: 'cor_1',
      error_code: 'event_schema_invalid',
    });

    OrchestrationLoggerService.requiredFields().forEach((field) => {
      expect(entry).toHaveProperty(field);
    });
  });

  it('rejects unknown log stages', () => {
    const log = new OrchestrationLoggerService({
      sink: { write: jest.fn() },
      clock,
    });
    expect(() => log.info('random', 'message', {}))
      .toThrow('Unknown orchestration log stage');
  });
});
