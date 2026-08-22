'use strict';

const fs = require('fs');
const path = require('path');
const DashboardTemplate = require('../../src/utils/DashboardTemplate');

describe('T124 supplemental: OpenClaw Monitor page contract', () => {
  const pageScriptPath = path.join(__dirname, '../../public/js/pages/openclaw.js');

  test('renders real orchestrator health and operational counters', () => {
    const html = DashboardTemplate.renderPage('openclaw');
    const script = fs.readFileSync(pageScriptPath, 'utf8');

    [
      'openclaw-health',
      'openclaw-production',
      'company-dashboard-health',
      'company-dashboard-link',
      'openclaw-active-workflows',
      'openclaw-pending-approvals',
      'openclaw-dead-letters',
      'openclaw-exceptions',
    ].forEach((id) => expect(html).toContain(`id="${id}"`));
    expect(script).toContain("api.get('/api/openclaw/overview')");
    expect(script).toContain('operationalCounts');
    expect(script).toContain('companyDashboard');
    expect(script).toContain('Promise.allSettled');
  });

  test('renders operational cards for all agents returned by OpenClaw', () => {
    const html = DashboardTemplate.renderPage('openclaw');
    const script = fs.readFileSync(pageScriptPath, 'utf8');

    expect(html).toContain('id="openclaw-agent-list"');
    expect(html).toContain('5 Đần chuyên trách');
    expect(script).toContain("api.get('/api/openclaw/agents')");
    expect(script).toContain('renderAgentCard');
    expect(script).toContain('lifecycleStatus');
    expect(script).toContain('controlOpenClawAgent');
    expect(script).toContain('expectedVersion');
    expect(script).toContain('QUARANTINED');
  });

  test('renders filterable workflow list backed by the OpenClaw API', () => {
    const html = DashboardTemplate.renderPage('openclaw');
    const script = fs.readFileSync(pageScriptPath, 'utf8');

    expect(html).toContain('id="openclaw-workflow-list"');
    expect(html).toContain('id="openclaw-workflow-agent"');
    expect(html).toContain('id="openclaw-workflow-state"');
    expect(script).toContain('/api/openclaw/workflows?');
    expect(script).toContain('renderWorkflowRow');
    expect(html).toContain('id="openclaw-workflow-detail"');
    expect(script).toContain('/api/openclaw/workflows/${encodeURIComponent(workflowId)}');
    expect(script).toContain('Audit timeline');
  });
});
