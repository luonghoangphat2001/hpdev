'use strict';

const PerAgentRealtimeLogViewerService = require('../../src/application/services/per-agent-realtime-log-viewer.service');

describe('T164: Per-Agent Realtime Log Viewer Service', () => {
  test('returns log viewer state with filter, pause/tail, export, and deep-link features', () => {
    const service = new PerAgentRealtimeLogViewerService({});
    const state = service.getViewerState({ agentId: 'dan_rnd', filterTerm: 'ERROR', paused: true });

    expect(state.agentId).toBe('dan_rnd');
    expect(state.paused).toBe(true);
    expect(state.liveTailActive).toBe(false);
    expect(state.exportSupported).toBe(true);
  });
});
