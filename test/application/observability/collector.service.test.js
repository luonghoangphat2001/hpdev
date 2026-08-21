'use strict';

const LogCollectorService = require('../../../src/services/reporting/dashboard/log-collector.service');

describe('T162: Realtime Log Collector and Durable Buffer Service', () => {
  test('ingests non-blocking log entries and flushes buffer cleanly', () => {
    const service = new LogCollectorService({});
    const res1 = service.ingestLog({ agentId: 'dan_cfo', message: 'Calculated ROI' });
    expect(res1.ingested).toBe(true);
    expect(res1.bufferLength).toBe(1);

    const logs = service.flushBuffer();
    expect(logs.length).toBe(1);
    expect(logs[0].agentId).toBe('dan_cfo');

    const emptyFlush = service.flushBuffer();
    expect(emptyFlush.length).toBe(0);
  });
});
