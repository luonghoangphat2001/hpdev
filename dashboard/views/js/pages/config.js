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
    const data = await this.#api.getConfig();
    this.activeModel         = data.active_model          || 'gemini';
    this.discordActiveModel  = data.discord_active_model  || 'claude';
    this.telegramActiveModel = data.telegram_active_model || 'gemini';

    document.getElementById('system-prompt').value     = data.system_prompt   || '';
    document.getElementById('claude-base-url').value   = data.claude_base_url || '';
    if (data.gemini_model)  document.getElementById('gemini-model').value  = data.gemini_model;
    if (data.claude_model)  document.getElementById('claude-model').value  = data.claude_model;
    if (data.chatgpt_model) document.getElementById('chatgpt-model').value = data.chatgpt_model;

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

    this.#toggleSections(this.activeModel);
  }

  #toggleSections(model) {
    document.getElementById('gemini-model-wrap').style.display    = model === 'gemini'  ? 'block' : 'none';
    document.getElementById('claude-model-wrap').style.display    = model === 'claude'  ? 'block' : 'none';
    document.getElementById('claude-base-url-wrap').style.display = model === 'claude'  ? 'block' : 'none';
    document.getElementById('chatgpt-model-wrap').style.display   = model === 'chatgpt' ? 'block' : 'none';
  }
}
