import { fmtTokens } from '../utils.js';
import { getProviderMeta, PROVIDER_ORDER } from '../providerCatalog.js';

/** Derive a provider group and display metadata from any model string. */
export function getProviderGroup(m) {
  const s = String(m || '').toLowerCase();
  if (s.includes('gemini') || s.startsWith('models/')) {
    return { key: 'gemini', ...getProviderMeta('gemini'), name: 'Google Gemini' };
  }
  if (s.includes('claude') || s.includes('anthropic')) {
    return { key: 'claude', ...getProviderMeta('claude'), name: 'Anthropic Claude' };
  }
  if (s.includes('gpt') || s.includes('o1') || s.includes('o3') || s.includes('openai') || s.includes('chatgpt')) {
    return { key: 'chatgpt', ...getProviderMeta('chatgpt'), name: 'OpenAI ChatGPT' };
  }
  if (s.includes('deepseek')) {
    return { key: 'deepseek', ...getProviderMeta('deepseek'), name: 'DeepSeek AI' };
  }
  if (s.includes('vllm')) {
    return { key: 'vllm', ...getProviderMeta('vllm'), name: 'vLLM Local / Server' };
  }
  if (s.includes('kimi') || s.includes('moonshot')) {
    return { key: 'kimi', ...getProviderMeta('kimi'), name: 'Moonshot Kimi' };
  }
  if (s.includes('ollama') || s.includes('llama') || s.includes('qwen') || s.includes('mistral') || s.includes('gemma')) {
    return { key: 'ollama', ...getProviderMeta('ollama'), name: 'Ollama & Open-Source' };
  }
  if (s.includes('nvidia') || s.includes('nim')) {
    return { key: 'nvidia', ...getProviderMeta('nvidia'), name: 'NVIDIA NIM' };
  }
  if (s.includes('cloudflare') || s.includes('@cf/')) {
    return { key: 'cloudflare', ...getProviderMeta('cloudflare'), name: 'Cloudflare Workers AI' };
  }
  return { key: 'other', icon: '🤖', label: 'Khác', display: 'Khác', name: 'Nhóm mô hình khác' };
}

/** Derive a display icon from any model name string. */
function modelIcon(m) {
  return getProviderGroup(m).icon;
}

/** Derive a short human-readable label from any model name string. */
function modelLabel(m) {
  if (!m) return 'unknown';
  return m.startsWith('models/') ? m.slice(7) : m;
}

/** Group array of items by provider group. */
function groupItemsByProvider(items, getModel = (item) => item.model) {
  const groupsMap = new Map();

  for (const item of items || []) {
    const groupMeta = getProviderGroup(getModel(item));
    if (!groupsMap.has(groupMeta.key)) {
      groupsMap.set(groupMeta.key, {
        ...groupMeta,
        items: [],
        totalCount: 0,
        totalTokensIn: 0,
        totalTokensOut: 0,
        totalTokens: 0,
        totalRequests: 0,
      });
    }

    const group = groupsMap.get(groupMeta.key);
    group.items.push(item);
    group.totalCount += Number(item.count) || 0;
    const inn = Number(item.tokens_in) || 0;
    const out = Number(item.tokens_out) || 0;
    group.totalTokensIn += inn;
    group.totalTokensOut += out;
    group.totalTokens += (inn + out);
    group.totalRequests += Number(item.requests) || 0;
  }

  // Sort groups according to PROVIDER_ORDER
  return Array.from(groupsMap.values()).sort((a, b) => {
    const orderA = PROVIDER_ORDER.indexOf(a.key);
    const orderB = PROVIDER_ORDER.indexOf(b.key);
    const idxA = orderA === -1 ? 999 : orderA;
    const idxB = orderB === -1 ? 999 : orderB;
    return idxA - idxB;
  });
}

/** Render a token usage bar card (reused in multiple sections). */
function tokenCard(m, compact = false) {
  const inn   = Number(m.tokens_in)  || 0;
  const out   = Number(m.tokens_out) || 0;
  const total = inn + out;
  const req   = Number(m.requests)   || 0;
  const pct   = total > 0 ? Math.round((out / total) * 100) : 0;
  const label = modelLabel(m.model);
  const icon  = modelIcon(m.model);

  if (compact) {
    return `
      <div class="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-700/40 transition">
        <span class="w-4 text-center text-xs shrink-0">${icon}</span>
        <span class="flex-1 text-gray-300 truncate text-xs font-mono">${label}</span>
        <span class="text-[11px] text-gray-400 shrink-0 font-mono">${req} reqs</span>
        <span class="text-xs text-yellow-400 font-semibold w-16 text-right shrink-0 font-mono">${fmtTokens(total)}</span>
        <span class="text-[11px] text-gray-400 w-14 text-right shrink-0 font-mono">↑${fmtTokens(out)}</span>
      </div>`;
  }

  return `
    <div class="bg-gray-900/60 rounded-xl p-3 border border-gray-700/50 space-y-1.5">
      <div class="flex items-center justify-between text-xs sm:text-sm gap-2">
        <span class="font-medium text-gray-200 truncate flex items-center gap-1.5">
          <span>${icon}</span>
          <span class="font-mono text-xs sm:text-sm text-gray-300">${label}</span>
        </span>
        <span class="text-yellow-400 font-semibold text-xs shrink-0 font-mono">
          ${fmtTokens(total)} <span class="text-gray-500 font-normal">·</span> ${req} reqs
        </span>
      </div>
      <div class="w-full bg-gray-700/60 rounded-full h-1.5 overflow-hidden">
        <div class="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style="width:${pct}%"></div>
      </div>
      <div class="flex justify-between text-[11px] text-gray-400 font-mono pt-0.5">
        <span>📥 In: ${fmtTokens(inn)}</span>
        <span>📤 Out: ${fmtTokens(out)} (${pct}%)</span>
      </div>
    </div>`;
}

/** Render grouped message count cards with collapsible dropdown */
function renderGroupedMessages(byModel, totalMessages) {
  const groups = groupItemsByProvider(byModel);
  if (!groups.length) {
    return '<p class="text-gray-500 text-xs sm:text-sm">Chưa có dữ liệu tin nhắn.</p>';
  }

  const total = Number(totalMessages) || groups.reduce((acc, g) => acc + g.totalCount, 0) || 1;

  return groups.map((g) => {
    const groupPct = Math.round((g.totalCount / total) * 100);

    return `
      <details class="group/stat bg-gray-900/60 hover:bg-gray-900/80 rounded-2xl border border-gray-700/60 overflow-hidden transition shadow-sm">
        <summary class="flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none gap-2 hover:bg-gray-800/40 transition">
          <div class="flex items-center gap-2 min-w-0">
            <svg class="w-4 h-4 text-gray-400 stat-chevron shrink-0 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            <span class="text-base shrink-0">${g.icon}</span>
            <span class="font-semibold text-xs sm:text-sm text-gray-200 truncate">${g.name}</span>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-semibold shrink-0">${groupPct}%</span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-[11px] text-gray-500 font-mono hidden sm:inline">(${g.items.length} models)</span>
            <span class="text-xs sm:text-sm font-bold text-indigo-400 font-mono">${g.totalCount} msgs</span>
          </div>
        </summary>
        <div class="px-3.5 pb-3.5 pt-1 space-y-1.5 border-t border-gray-800/80">
          ${g.items.map((m) => {
            const mCount = Number(m.count) || 0;
            const mPct = g.totalCount > 0 ? Math.round((mCount / g.totalCount) * 100) : 0;
            return `
              <div class="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-gray-950/40 hover:bg-gray-800/60 border border-gray-800/60 transition gap-2">
                <span class="text-gray-300 font-mono truncate">${modelLabel(m.model)}</span>
                <div class="flex items-center gap-2.5 shrink-0">
                  <span class="text-[10px] text-gray-500 font-mono">${mPct}%</span>
                  <span class="text-xs text-indigo-300 font-semibold font-mono">${mCount} msgs</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </details>`;
  }).join('');
}

/** Render grouped token usage cards with collapsible dropdown */
function renderGroupedTokens(tokensByModel) {
  const groups = groupItemsByProvider(tokensByModel);
  if (!groups.length) {
    return '<p class="text-gray-500 text-xs sm:text-sm">Chưa có dữ liệu token.</p>';
  }

  return groups.map((g) => `
    <details class="group/stat bg-gray-900/60 hover:bg-gray-900/80 rounded-2xl border border-gray-700/60 overflow-hidden transition shadow-sm">
      <summary class="flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none gap-2 hover:bg-gray-800/40 transition">
        <div class="flex items-center gap-2 min-w-0">
          <svg class="w-4 h-4 text-gray-400 stat-chevron shrink-0 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <span class="text-base shrink-0">${g.icon}</span>
          <span class="font-semibold text-xs sm:text-sm text-gray-200 truncate">${g.name}</span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 font-medium shrink-0">${g.items.length} models</span>
        </div>
        <div class="text-right shrink-0">
          <span class="text-xs sm:text-sm font-bold text-yellow-400 font-mono">${fmtTokens(g.totalTokens)}</span>
          <span class="text-[11px] text-gray-500 font-mono block">(${g.totalRequests} reqs)</span>
        </div>
      </summary>
      <div class="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-gray-800/80">
        ${g.items.map((m) => tokenCard(m)).join('')}
      </div>
    </details>`
  ).join('');
}

/** Render grouped today's usage cards with collapsible dropdown */
function renderGroupedToday(todayByModel) {
  const groups = groupItemsByProvider(todayByModel);
  if (!groups.length) {
    return '<p class="text-gray-500 text-xs sm:text-sm">Chưa có dữ liệu hôm nay.</p>';
  }

  return groups.map((g) => `
    <details class="group/stat bg-gray-900/60 hover:bg-gray-900/80 rounded-2xl border border-gray-700/60 overflow-hidden transition shadow-sm">
      <summary class="flex items-center justify-between p-3 sm:p-3.5 cursor-pointer select-none gap-2 hover:bg-gray-800/40 transition">
        <div class="flex items-center gap-2 min-w-0">
          <svg class="w-4 h-4 text-gray-400 stat-chevron shrink-0 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <span class="text-base shrink-0">${g.icon}</span>
          <span class="font-semibold text-xs sm:text-sm text-gray-200 truncate">${g.name}</span>
        </div>
        <span class="text-xs sm:text-sm font-bold text-yellow-400 font-mono shrink-0">${fmtTokens(g.totalTokens)}</span>
      </summary>
      <div class="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-gray-800/80">
        ${g.items.map((m) => tokenCard(m)).join('')}
      </div>
    </details>`
  ).join('');
}

export class StatsPage {
  #api;
  #getActiveModel;   // () => string

  constructor(api, getActiveModel) {
    this.#api            = api;
    this.#getActiveModel = getActiveModel;
  }

  async load() {
    const data = await this.#api.getStats();

    // ── Summary cards ────────────────────────────────────
    document.getElementById('stat-total').textContent = data.total;
    document.getElementById('stat-today').textContent = data.today;

    const activeModel = this.#getActiveModel();
    document.getElementById('stat-model-name').textContent =
      getProviderMeta(activeModel).display || activeModel;

    // ── Today ─────────────────────────────────────────────
    const todayEl   = document.getElementById('stat-today-by-model');
    const dateLabel = document.getElementById('stat-today-date');
    if (dateLabel) dateLabel.textContent = new Date().toLocaleDateString('vi-VN');

    todayEl.innerHTML = renderGroupedToday(data.todayByModel || []);

    // ── 7-day daily breakdown ─────────────────────────────
    const dailyEl = document.getElementById('stat-daily');
    if (dailyEl) {
      if (!(data.dailyUsage || []).length) {
        dailyEl.innerHTML = '<p class="text-gray-500 text-xs sm:text-sm">Chưa có dữ liệu.</p>';
      } else {
        // Group rows by day
        const byDay = {};
        for (const row of data.dailyUsage) {
          const d = String(row.day).slice(0, 10); // "2026-03-13"
          if (!byDay[d]) byDay[d] = [];
          byDay[d].push(row);
        }
        dailyEl.innerHTML = Object.entries(byDay).map(([day, rows]) => {
          const dayTotal = rows.reduce((s, r) => s + Number(r.tokens_in) + Number(r.tokens_out), 0);
          const dayReqs  = rows.reduce((s, r) => s + Number(r.requests), 0);
          return `
            <div class="mb-3 bg-gray-900/40 rounded-xl p-2.5 border border-gray-700/40">
              <div class="flex justify-between text-xs font-semibold text-gray-400 mb-1 px-1">
                <span>📅 ${day}</span>
                <span class="font-mono text-indigo-300">${dayReqs} reqs · ${fmtTokens(dayTotal)} tokens</span>
              </div>
              ${rows.map(m => tokenCard(m, true)).join('')}
            </div>`;
        }).join('');
      }
    }

    // ── All-time by model (Grouped) ───────────────────────
    document.getElementById('stat-by-model').innerHTML = renderGroupedMessages(data.byModel || [], data.total);

    // ── All-time token totals (Grouped) ───────────────────
    document.getElementById('stat-tokens').innerHTML = renderGroupedTokens(data.tokensByModel || []);
  }
}

