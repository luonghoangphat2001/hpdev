import { fmtTokens } from '../utils.js';

const MODEL_ICON = { gemini: '🌟', claude: '✳️', chatgpt: '🤖' };

export class StatsPage {
  #api;
  #getActiveModel;   // () => string

  constructor(api, getActiveModel) {
    this.#api            = api;
    this.#getActiveModel = getActiveModel;
  }

  async load() {
    const data = await this.#api.getStats();

    document.getElementById('stat-total').textContent = data.total;
    document.getElementById('stat-today').textContent = data.today;

    const modelNames = { gemini: 'Gemini', claude: 'Claude', chatgpt: 'ChatGPT' };
    document.getElementById('stat-model-name').textContent =
      modelNames[this.#getActiveModel()] || this.#getActiveModel();

    document.getElementById('stat-by-model').innerHTML = data.byModel.map(m => `
      <div class="flex justify-between text-sm py-1 border-b border-gray-700">
        <span class="text-gray-300">${m.model || 'unknown'}</span>
        <span class="text-indigo-400 font-semibold">${m.count} msgs</span>
      </div>`
    ).join('') || '<p class="text-gray-500 text-sm">Chưa có dữ liệu.</p>';

    document.getElementById('stat-tokens').innerHTML = (data.tokensByModel || []).map(m => {
      const inn   = Number(m.tokens_in)  || 0;
      const out   = Number(m.tokens_out) || 0;
      const total = inn + out;
      const pct   = total > 0 ? Math.round((out / total) * 100) : 0;
      const icon  = MODEL_ICON[m.model] || '🤖';
      return `
        <div class="space-y-1">
          <div class="flex justify-between text-sm">
            <span class="font-medium text-gray-200">${icon} ${m.model || 'unknown'}</span>
            <span class="text-yellow-400 font-semibold">${fmtTokens(total)} total</span>
          </div>
          <div class="w-full bg-gray-700 rounded-full h-2">
            <div class="bg-indigo-500 h-2 rounded-full" style="width:${pct}%"></div>
          </div>
          <div class="flex justify-between text-xs text-gray-500">
            <span>📥 In: ${fmtTokens(inn)}</span>
            <span>📤 Out: ${fmtTokens(out)}</span>
          </div>
        </div>`;
    }).join('') || '<p class="text-gray-500 text-sm">Chưa có dữ liệu token.</p>';
  }
}
