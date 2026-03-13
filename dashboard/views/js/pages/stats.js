import { fmtTokens } from '../utils.js';

/** Derive a display icon from any model name string. */
function modelIcon(m) {
  if (!m) return '🤖';
  if (m.includes('gemini') || m === 'gemini') return '🌟';
  if (m.startsWith('claude') || m === 'claude') return '✳️';
  return '🤖';
}

/** Derive a short human-readable label from any model name string. */
function modelLabel(m) {
  if (!m) return 'unknown';
  // "models/gemini-2.5-flash" → "gemini-2.5-flash"
  return m.startsWith('models/') ? m.slice(7) : m;
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
      <div class="flex items-center gap-3 py-1.5 border-b border-gray-700">
        <span class="w-5 text-center">${icon}</span>
        <span class="flex-1 text-gray-300 truncate text-xs">${label}</span>
        <span class="text-xs text-gray-500">${req} reqs</span>
        <span class="text-xs text-yellow-400 font-semibold w-16 text-right">${fmtTokens(total)}</span>
        <span class="text-xs text-gray-500 w-12 text-right">↑${fmtTokens(out)}</span>
      </div>`;
  }

  return `
    <div class="space-y-1">
      <div class="flex justify-between text-sm">
        <span class="font-medium text-gray-200">${icon} ${label}</span>
        <span class="text-yellow-400 font-semibold">${fmtTokens(total)} total &nbsp;·&nbsp; ${req} reqs</span>
      </div>
      <div class="w-full bg-gray-700 rounded-full h-2">
        <div class="bg-indigo-500 h-2 rounded-full" style="width:${pct}%"></div>
      </div>
      <div class="flex justify-between text-xs text-gray-500">
        <span>📥 In: ${fmtTokens(inn)}</span>
        <span>📤 Out: ${fmtTokens(out)}</span>
      </div>
    </div>`;
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

    const modelNames = { gemini: 'Gemini', claude: 'Claude', chatgpt: 'ChatGPT' };
    document.getElementById('stat-model-name').textContent =
      modelNames[this.#getActiveModel()] || this.#getActiveModel();

    // ── Today ─────────────────────────────────────────────
    const todayEl   = document.getElementById('stat-today-by-model');
    const dateLabel = document.getElementById('stat-today-date');
    if (dateLabel) dateLabel.textContent = new Date().toLocaleDateString('vi-VN');

    todayEl.innerHTML = (data.todayByModel || []).length
      ? (data.todayByModel).map(m => tokenCard(m)).join('')
      : '<p class="text-gray-500 text-sm">Chưa có dữ liệu hôm nay.</p>';

    // ── 7-day daily breakdown ─────────────────────────────
    const dailyEl = document.getElementById('stat-daily');
    if (dailyEl) {
      if (!(data.dailyUsage || []).length) {
        dailyEl.innerHTML = '<p class="text-gray-500 text-sm">Chưa có dữ liệu.</p>';
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
            <div class="mb-3">
              <div class="flex justify-between text-xs font-semibold text-gray-400 mb-1 px-1">
                <span>${day}</span>
                <span>${dayReqs} reqs · ${fmtTokens(dayTotal)} tokens</span>
              </div>
              ${rows.map(m => tokenCard(m, true)).join('')}
            </div>`;
        }).join('');
      }
    }

    // ── All-time by model ────────────────────────────────
    document.getElementById('stat-by-model').innerHTML = (data.byModel || []).map(m => `
      <div class="flex justify-between text-sm py-1 border-b border-gray-700">
        <span class="text-gray-300">${modelIcon(m.model)} ${modelLabel(m.model)}</span>
        <span class="text-indigo-400 font-semibold">${m.count} msgs</span>
      </div>`
    ).join('') || '<p class="text-gray-500 text-sm">Chưa có dữ liệu.</p>';

    // ── All-time token totals ────────────────────────────
    document.getElementById('stat-tokens').innerHTML = (data.tokensByModel || [])
      .map(m => tokenCard(m))
      .join('') || '<p class="text-gray-500 text-sm">Chưa có dữ liệu token.</p>';
  }
}
