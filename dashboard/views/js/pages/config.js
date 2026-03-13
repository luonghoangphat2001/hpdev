export class ConfigPage {
  #api;
  #onModelChange;   // (model: string) => void

  activeModel         = 'gemini';
  discordActiveModel  = 'claude';
  telegramActiveModel = 'gemini';

  constructor(api, onModelChange) {
    this.#api           = api;
    this.#onModelChange = onModelChange;
  }

  // ── Public ──────────────────────────────────────────────
  async load() {
    const [data] = await Promise.all([
      this.#api.getConfig(),
      this.#loadModelOptions(),
    ]);

    this.activeModel         = data.active_model          || 'gemini';
    this.discordActiveModel  = data.discord_active_model  || 'claude';
    this.telegramActiveModel = data.telegram_active_model || 'gemini';

    document.getElementById('system-prompt').value   = data.system_prompt   || '';
    document.getElementById('claude-base-url').value = data.claude_base_url || '';
    if (data.gemini_model)  this.#selectOrAdd('gemini-model',  data.gemini_model);
    if (data.claude_model)  this.#selectOrAdd('claude-model',  data.claude_model);
    if (data.chatgpt_model) this.#selectOrAdd('chatgpt-model', data.chatgpt_model);

    this.#updateUI();
    this.#onModelChange(this.activeModel);
    return data;
  }

  async setDefaultModel(model, platform) {
    if (platform === 'discord') {
      this.discordActiveModel = model;
      await this.#api.saveConfig({ discord_active_model: model });
    } else if (platform === 'telegram') {
      this.telegramActiveModel = model;
      await this.#api.saveConfig({ telegram_active_model: model });
    } else {
      this.activeModel = model;
      this.#onModelChange(model);
      await this.#api.saveConfig({ active_model: model });
    }
    this.#updateUI();
  }

  async save() {
    await this.#api.saveConfig({
      active_model:          this.activeModel,
      discord_active_model:  this.discordActiveModel,
      telegram_active_model: this.telegramActiveModel,
      system_prompt:         document.getElementById('system-prompt').value,
      claude_base_url:       document.getElementById('claude-base-url').value,
      gemini_model:          document.getElementById('gemini-model').value,
      claude_model:          document.getElementById('claude-model').value,
      chatgpt_model:         document.getElementById('chatgpt-model').value,
    });
    this.#updateUI();
    const msg = document.getElementById('save-msg');
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 2000);
  }

  // ── Private ─────────────────────────────────────────────

  /** Fetch model lists from all three providers in parallel and populate selects. */
  async #loadModelOptions() {
    const [gemini, claude, chatgpt] = await Promise.allSettled([
      this.#api.getModels('gemini'),
      this.#api.getModels('claude'),
      this.#api.getModels('chatgpt'),
    ]);

    if (gemini.status  === 'fulfilled' && gemini.value.models?.length)  this.#populateSelect('gemini-model',  gemini.value.models);
    if (claude.status  === 'fulfilled' && claude.value.models?.length)  this.#populateSelect('claude-model',  claude.value.models);
    if (chatgpt.status === 'fulfilled' && chatgpt.value.models?.length) this.#populateSelect('chatgpt-model', chatgpt.value.models);
  }

  /**
   * Replace a <select>'s options with a live model list.
   * @param {string} selectId
   * @param {{ id: string, label: string }[]} models
   */
  #populateSelect(selectId, models) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '';
    for (const { id, label } of models) {
      const opt = document.createElement('option');
      opt.value       = id;
      opt.textContent = label;
      sel.appendChild(opt);
    }
    // Restore previously selected value if it still exists in the new list
    if (current && [...sel.options].some(o => o.value === current)) {
      sel.value = current;
    }
  }

  /**
   * Select an option by value; append it if not present so saved config is not lost.
   * @param {string} selectId
   * @param {string} value
   */
  #selectOrAdd(selectId, value) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    if (![...sel.options].some(o => o.value === value)) {
      const opt = document.createElement('option');
      opt.value = opt.textContent = value;
      sel.appendChild(opt);
    }
    sel.value = value;
  }

  #updateUI() {
    const ON   = 'border-indigo-500 bg-indigo-900 text-white';
    const OFF  = 'border-gray-600 text-gray-400';
    const BASE = 'flex-1 py-3 rounded-xl font-semibold border-2 transition text-sm';

    for (const m of ['gemini', 'claude', 'chatgpt']) {
      const d = document.getElementById(`btn-discord-${m}`);
      if (d) d.className = `${BASE} ${this.discordActiveModel === m ? ON : OFF}`;
      const t = document.getElementById(`btn-telegram-${m}`);
      if (t) t.className = `${BASE} ${this.telegramActiveModel === m ? ON : OFF}`;
    }

    const labelMap = { gemini: '🌟 Gemini', claude: '✳️ Claude', chatgpt: '🤖 ChatGPT' };
    const dl = document.getElementById('discord-model-label');
    if (dl) dl.textContent = labelMap[this.discordActiveModel] || this.discordActiveModel;
    const tl = document.getElementById('telegram-model-label');
    if (tl) tl.textContent = labelMap[this.telegramActiveModel] || this.telegramActiveModel;

    // Always show all model version pickers
    for (const id of ['gemini-model-wrap', 'claude-model-wrap', 'claude-base-url-wrap', 'chatgpt-model-wrap']) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'block';
    }
  }
}
