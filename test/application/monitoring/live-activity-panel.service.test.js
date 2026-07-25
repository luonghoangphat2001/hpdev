'use strict';

const LiveActivityPanelService = require('../../../src/application/services/monitoring/live-activity-panel.service');

describe('T130: Live "OpenClaw doing what" Activity Panel Service', () => {
  test('returns live step, reason, model, tool, and next step info', () => {
    const service = new LiveActivityPanelService();
    const activity = service.getLiveActivity({
      agentId: 'dan_ops',
      currentStep: 'Checking inventory SSOT',
      summaryReason: 'Low stock alert triggered',
      activeTool: 'ssot_inventory',
      activeModel: 'gemini-3.6-flash',
      nextStep: 'Create PO proposal',
    });

    expect(activity.agentId).toBe('dan_ops');
    expect(activity.activeTool).toBe('ssot_inventory');
    expect(activity.nextStep).toBe('Create PO proposal');
  });
});
