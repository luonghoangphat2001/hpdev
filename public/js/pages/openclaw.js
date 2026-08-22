import { encodeActionArgs } from '../app/events.js';

const LIMIT = 30;
let ocOffset = 0;
let ocTotal = 0;
let workflowFilterTimer = null;
let monitorApi = null;

export async function loadOpenClaw(api) {
  monitorApi = api;
  ocOffset = 0;
  const [overviewResult, agentsResult, workflowsResult, interactionsResult] = await Promise.allSettled([
    api.get('/api/openclaw/overview'),
    api.get('/api/openclaw/agents'),
    loadWorkflowData(api),
    api.get(`/api/openclaw-logs?limit=${LIMIT}&offset=0`),
  ]);

  renderOverviewResult(overviewResult);
  renderAgentsResult(agentsResult);
  renderWorkflowResult(workflowsResult);
  renderInteractionResult(interactionsResult);
}

export async function openClawLoadMore(api) {
  ocOffset += LIMIT;
  const data = await api.get(`/api/openclaw-logs?limit=${LIMIT}&offset=${ocOffset}`);
  const list = document.getElementById('openclaw-list');
  list.insertAdjacentHTML('beforeend', renderRows(data.logs));
  updateFooter();
}

export async function controlOpenClawAgent(api, agentId, toState, expectedVersion) {
  const reason = window.prompt(`Lý do chuyển ${agentId} sang ${toState}:`);
  if (!reason?.trim()) return;
  if (!window.confirm(`Xác nhận chuyển ${agentId} sang ${toState}?`)) return;

  try {
    const result = await api.controlAgent(agentId, toState, expectedVersion, reason.trim());
    if (!result.ok) {
      window.alert(result.error || 'Không thể thay đổi trạng thái agent.');
      return;
    }
    await loadOpenClaw(api);
  } catch (error) {
    window.alert(error.message || 'Không thể thay đổi trạng thái agent.');
  }
}

export function openClawWorkflowFiltersChanged(api) {
  window.clearTimeout(workflowFilterTimer);
  workflowFilterTimer = window.setTimeout(async () => {
    const result = await Promise.resolve(loadWorkflowData(api))
      .then((value) => ({ status: 'fulfilled', value }))
      .catch((reason) => ({ status: 'rejected', reason }));
    renderWorkflowResult(result);
  }, 250);
}

function loadWorkflowData(api) {
  const query = new URLSearchParams({ limit: '50', offset: '0' });
  const agentId = document.getElementById('openclaw-workflow-agent')?.value || '';
  const state = document.getElementById('openclaw-workflow-state')?.value || '';
  const search = document.getElementById('openclaw-workflow-search')?.value.trim() || '';
  if (agentId) query.set('agentId', agentId);
  if (state) query.set('state', state);
  if (search) query.set('search', search);
  return api.get(`/api/openclaw/workflows?${query.toString()}`);
}

function updateFooter() {
  document.getElementById('openclaw-count').textContent =
    `${Math.min(ocOffset + LIMIT, ocTotal)} / ${ocTotal} bản ghi`;
  const btn = document.getElementById('openclaw-load-more');
  btn.classList.toggle('hidden', ocOffset + LIMIT >= ocTotal);
}

function renderOverviewResult(result) {
  const error = document.getElementById('openclaw-overview-error');
  if (result.status === 'rejected' || !result.value?.ok) {
    error.textContent = 'Không thể kết nối control-plane OpenClaw. Kiểm tra URL, secret và trạng thái dịch vụ.';
    error.classList.remove('hidden');
    setText('openclaw-health', 'MẤT KẾT NỐI', 'text-red-300');
    return;
  }

  error.classList.add('hidden');
  const overview = result.value.overview;
  const counts = overview.operationalCounts || {};
  setText('openclaw-health', overview.status === 'UP' ? 'ĐANG HOẠT ĐỘNG' : overview.status, 'text-green-300');
  setText(
    'openclaw-production',
    overview.productionEnabled ? 'ĐÃ BẬT' : 'ĐANG KHÓA',
    overview.productionEnabled ? 'text-green-300' : 'text-amber-300',
  );
  const companyDashboard = overview.companyDashboard || {};
  const companyDashboardStatus = companyDashboard.status || 'CHƯA CẤU HÌNH';
  setText(
    'company-dashboard-health',
    companyDashboardStatus === 'UP' ? 'ĐÃ KẾT NỐI' : companyDashboardStatus,
    companyDashboardStatus === 'UP' ? 'text-green-300' : 'text-amber-300',
  );
  const companyDashboardLink = document.getElementById('company-dashboard-link');
  if (companyDashboardLink && companyDashboard.baseUrl) {
    companyDashboardLink.href = companyDashboard.baseUrl;
    companyDashboardLink.classList.remove('hidden');
  }
  setText('openclaw-active-workflows', counts.activeWorkflowCount ?? 0);
  setText('openclaw-pending-approvals', counts.pendingApprovalCount ?? 0);
  setText('openclaw-dead-letters', counts.unresolvedDeadLetterCount ?? 0);
  setText('openclaw-exceptions', counts.openExceptionCount ?? 0);
  setText('openclaw-generated-at', formatDateTime(overview.generatedAt));
}

function renderInteractionResult(result) {
  const list = document.getElementById('openclaw-list');
  if (result.status === 'rejected' || !result.value) {
    list.innerHTML = '<div class="p-6 text-red-300 text-sm">Không tải được lịch sử công cụ.</div>';
    return;
  }
  const data = result.value;
  ocTotal = Number(data.total || 0);
  list.innerHTML = renderRows(data.logs || []);
  updateFooter();
}

function renderAgentsResult(result) {
  const list = document.getElementById('openclaw-agent-list');
  const count = document.getElementById('openclaw-agent-count');
  if (result.status === 'rejected' || !result.value?.ok) {
    list.innerHTML = '<div class="bg-red-950/40 border border-red-800 rounded-xl p-4 text-sm text-red-300">Không tải được trạng thái agent.</div>';
    count.textContent = 'Mất kết nối';
    return;
  }

  const agents = result.value.agents || [];
  count.textContent = `${agents.length} agent`;
  list.innerHTML = agents.map(renderAgentCard).join('');
}

function renderWorkflowResult(result) {
  const list = document.getElementById('openclaw-workflow-list');
  const count = document.getElementById('openclaw-workflow-count');
  if (result.status === 'rejected' || !result.value?.ok) {
    list.innerHTML = '<div class="p-5 text-sm text-red-300">Không tải được workflow.</div>';
    count.textContent = 'Mất kết nối';
    return;
  }
  const workflows = result.value.workflows || [];
  count.textContent = `${workflows.length} / ${result.value.total || 0}`;
  list.innerHTML = workflows.length
    ? workflows.map(renderWorkflowRow).join('')
    : '<div class="p-5 text-sm text-gray-400">Không có workflow phù hợp.</div>';
  list.querySelectorAll('[data-workflow-id]').forEach((element) => {
    element.addEventListener('click', () => loadWorkflowDetail(element.dataset.workflowId));
  });
}

function renderWorkflowRow(workflow) {
  const stateClass = {
    completed: 'text-green-300 bg-green-950',
    failed: 'text-red-300 bg-red-950',
    awaiting_approval: 'text-amber-300 bg-amber-950',
    running: 'text-cyan-300 bg-cyan-950',
    paused: 'text-fuchsia-300 bg-fuchsia-950',
  }[workflow.state] || 'text-gray-300 bg-gray-900';
  return `
    <button type="button" data-workflow-id="${esc(workflow.workflowId)}"
      class="w-full text-left px-5 py-4 hover:bg-gray-750 transition">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="font-mono text-sm text-white">${esc(workflow.workflowId)}</span>
        <span class="px-2 py-0.5 rounded text-[11px] ${stateClass}">${esc(workflow.state)}</span>
        <span class="px-2 py-0.5 rounded text-[11px] bg-gray-900 text-gray-400">${esc(workflow.riskLevel)}</span>
        <span class="ml-auto text-xs text-gray-500">${formatDateTime(workflow.updatedAt)}</span>
      </div>
      <div class="mt-2 flex items-center gap-3 text-xs text-gray-400">
        <span>${esc(workflow.assignedAgentId || 'unassigned')}</span>
        <span>${esc(workflow.workflowType)}</span>
        <span>priority ${esc(workflow.priority)}</span>
      </div>
      ${workflow.failureReason ? `<div class="mt-2 text-xs text-red-300">${esc(workflow.failureReason)}</div>` : ''}
    </button>`;
}

async function loadWorkflowDetail(workflowId) {
  const panel = document.getElementById('openclaw-workflow-detail');
  panel.classList.remove('hidden');
  panel.innerHTML = '<div class="text-sm text-gray-400">Đang tải chi tiết workflow…</div>';
  try {
    const result = await monitorApi.get(
      `/api/openclaw/workflows/${encodeURIComponent(workflowId)}`,
    );
    if (!result.ok) throw new Error(result.error || 'Workflow detail failed');
    panel.innerHTML = renderWorkflowDetail(result.detail);
  } catch (_error) {
    panel.innerHTML = '<div class="text-sm text-red-300">Không tải được chi tiết workflow.</div>';
  }
}

function renderWorkflowDetail(detail) {
  const workflow = detail.workflow || {};
  return `
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="font-semibold text-white">Timeline · ${esc(workflow.workflowId)}</h3>
        <p class="text-xs text-gray-500 mt-1">${esc(workflow.workflowType)} · ${esc(workflow.assignedAgentId || 'unassigned')}</p>
      </div>
      <button type="button" data-close-workflow-detail
        class="text-xs text-gray-400 hover:text-white">Đóng</button>
    </div>
    <div class="grid md:grid-cols-3 gap-3 mt-4 text-xs">
      <div class="rounded-lg bg-gray-800 p-3"><span class="text-gray-500">State</span><div class="mt-1 text-white">${esc(workflow.state)} · v${esc(workflow.stateVersion)}</div></div>
      <div class="rounded-lg bg-gray-800 p-3"><span class="text-gray-500">Risk</span><div class="mt-1 text-white">${esc(workflow.riskLevel)}</div></div>
      <div class="rounded-lg bg-gray-800 p-3"><span class="text-gray-500">Policy</span><div class="mt-1 text-white">${esc(workflow.policyVersion)}</div></div>
    </div>
    ${renderDetailGroup('Actions', detail.actions || [], (item) =>
    `${esc(item.actionName)} · ${esc(item.status)} · ${esc(item.riskLevel)}`)}
    ${renderDetailGroup('Approvals', detail.approvals || [], (item) =>
      `${esc(item.approvalId)} · ${esc(item.status)} · v${esc(item.decisionVersion)}`)}
    ${renderDetailGroup('Audit timeline', detail.timeline || [], (item) =>
        `${formatDateTime(item.occurredAt)} · ${esc(item.auditType)} · ${esc(item.fromState || '—')} → ${esc(item.toState || '—')} · ${esc(item.actorId)}`)}
  `;
}

function renderDetailGroup(title, rows, formatter) {
  const content = rows.length
    ? rows.map((row) => `<li class="px-3 py-2 bg-gray-800 rounded">${formatter(row)}</li>`).join('')
    : '<li class="px-3 py-2 bg-gray-800 rounded text-gray-500">Không có dữ liệu.</li>';
  return `<div class="mt-4"><h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">${title}</h4><ul class="space-y-1 text-xs text-gray-300">${content}</ul></div>`;
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('[data-close-workflow-detail]')) return;
  const panel = document.getElementById('openclaw-workflow-detail');
  panel.classList.add('hidden');
  panel.innerHTML = '';
});

function renderAgentCard(agent) {
  const busy = agent.activityStatus === 'BUSY';
  const activityClass = busy ? 'bg-cyan-950 text-cyan-300' : 'bg-gray-700 text-gray-300';
  const lifecycleWarning = agent.lifecycleStatus === 'UNKNOWN'
    ? '<span class="text-amber-400">Chưa có trạng thái lifecycle</span>'
    : `<span class="text-green-400">${esc(agent.lifecycleStatus)} · v${esc(agent.stateVersion)}</span>`;
  const capabilities = (agent.capabilities || []).map((value) =>
    `<span class="px-2 py-1 rounded bg-gray-900 text-gray-400">${esc(value)}</span>`).join('');
  const model = agent.model || {};
  const primaryModel = model.primary
    ? `${model.primary.provider}:${model.primary.name}`
    : 'Chưa cấu hình';
  const fallbackModel = model.fallback
    ? `${model.fallback.provider}:${model.fallback.name}`
    : '—';

  return `
    <article class="bg-gray-800 rounded-xl border border-gray-700 p-4 space-y-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="font-semibold text-white">${esc(agent.agentId)}</h3>
          <p class="text-xs text-gray-500">${esc(agent.department)} · v${esc(agent.version)}</p>
        </div>
        <span class="px-2 py-1 rounded text-xs font-semibold ${activityClass}">${esc(agent.activityStatus)}</span>
      </div>
      <p class="text-sm text-gray-300">${esc(agent.mission)}</p>
      <div class="rounded-lg bg-gray-900 px-3 py-2 text-xs">
        <div class="text-gray-500">Model</div>
        <div class="text-cyan-300 break-all">${esc(primaryModel)}</div>
        <div class="text-gray-500 mt-1">Fallback: <span class="text-gray-300">${esc(fallbackModel)}</span></div>
      </div>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div class="rounded-lg bg-gray-900 p-2"><div class="text-lg font-bold">${agent.workflowCount}</div><div class="text-[11px] text-gray-500">Tổng</div></div>
        <div class="rounded-lg bg-gray-900 p-2"><div class="text-lg font-bold text-cyan-300">${agent.activeWorkflowCount}</div><div class="text-[11px] text-gray-500">Đang chạy</div></div>
        <div class="rounded-lg bg-gray-900 p-2"><div class="text-lg font-bold text-red-300">${agent.failedWorkflowCount}</div><div class="text-[11px] text-gray-500">Lỗi</div></div>
      </div>
      <div class="flex flex-wrap gap-1 text-[11px]">${capabilities}</div>
      <div class="pt-2 border-t border-gray-700 text-xs flex items-center justify-between gap-2">
        <span>${lifecycleWarning}</span>
        <div class="flex flex-wrap justify-end gap-1">${renderLifecycleActions(agent)}</div>
      </div>
    </article>`;
}

function renderLifecycleActions(agent) {
  if (!agent.stateVersion) return '';
  const actions = {
    ACTIVE: [['Tạm dừng', 'PAUSED'], ['Cách ly', 'QUARANTINED']],
    PAUSED: [['Tiếp tục', 'ACTIVE'], ['Đình chỉ', 'SUSPENDED']],
    SUSPENDED: [['Tiếp tục', 'ACTIVE'], ['Sửa lỗi', 'FIXING']],
    QUARANTINED: [['Sửa lỗi', 'FIXING']],
    FIXING: [['Chuyển test', 'TESTING']],
    TESTING: [['Canary', 'CANARY'], ['Kích hoạt', 'ACTIVE']],
    CANARY: [['Kích hoạt', 'ACTIVE'], ['Cách ly', 'QUARANTINED']],
  }[agent.lifecycleStatus] || [];

  return actions.map(([label, target]) => `
    <button
      data-action="openclaw.controlAgent" data-action-args="${encodeActionArgs(agent.agentId, target, Number(agent.stateVersion))}"
      class="px-2 py-1 rounded border border-gray-600 text-gray-300 hover:border-indigo-500 hover:text-white">
      ${label}
    </button>`).join('');
}

function setText(id, value, colorClass = null) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = String(value);
  if (colorClass) {
    element.classList.remove('text-gray-300', 'text-red-300', 'text-green-300', 'text-amber-300');
    element.classList.add(colorClass);
  }
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('vi-VN');
}

function renderRows(logs) {
  if (!logs.length) return '<div class="p-6 text-gray-400 text-sm">Chưa có dữ liệu.</div>';
  return logs.map((log) => {
    const badge = log.query_type === 'crawl'
      ? '<span class="px-2 py-0.5 rounded text-xs bg-blue-900 text-blue-300">crawl</span>'
      : '<span class="px-2 py-0.5 rounded text-xs bg-green-900 text-green-300">search</span>';
    const platform = log.platform === 'discord'
      ? '<span class="text-indigo-400">Discord</span>'
      : '<span class="text-sky-400">Telegram</span>';
    return `
      <div class="p-4 hover:bg-gray-750 space-y-2">
        <div class="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
          ${badge} ${platform}
          <span class="font-medium text-white">${esc(log.username)}</span>
          <span class="ml-auto">${log.created_at}</span>
        </div>
        <div class="text-sm text-yellow-200 font-medium">${esc(log.query)}</div>
        <details class="text-xs">
          <summary class="cursor-pointer text-gray-400 hover:text-gray-200">Kết quả OpenClaw</summary>
          <pre class="mt-2 text-gray-300 whitespace-pre-wrap break-words bg-gray-900 rounded p-3 max-h-48 overflow-y-auto">${esc(log.result_preview || '')}</pre>
        </details>
        <details class="text-xs">
          <summary class="cursor-pointer text-gray-400 hover:text-gray-200">AI tóm tắt → lưu history</summary>
          <div class="mt-2 text-gray-200 bg-gray-900 rounded p-3 max-h-48 overflow-y-auto">${esc(log.ai_summary || '')}</div>
        </details>
      </div>`;
  }).join('');
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
