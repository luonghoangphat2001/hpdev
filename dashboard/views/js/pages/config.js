export class ConfigPage {
  #api;
  #onModelChange;   // (model: string) => void

  activeModel = 'gemini';

  constructor(api, onModelChange) {
    this.#api           = api;
    this.#onModelChange = onModelChange;
  }

  // ── Public ──────────────────────────────────────────────
  async load() {
    const data = await this.#api.getConfig();
    this.activeModel = data.active_model || 'gemini';

    document.getElementById('system-prompt').value     = data.system_prompt  || '';
    document.getElementById('claude-base-url').value   = data.claude_base_url || '';
    if (data.gemini_model)  document.getElementById('gemini-model').value  = data.gemini_model;
    if (data.claude_model)  document.getElementById('claude-model').value  = data.claude_model;
    if (data.chatgpt_model) document.getElementById('chatgpt-model').value = data.chatgpt_model;

    this.#updateUI();
    this.#onModelChange(this.activeModel);
    return data;
  }

  async setDefaultModel(model) {
    this.activeModel = model;
    this.#updateUI();
    this.#onModelChange(model);
    await this.#api.saveConfig({ active_model: model });
  }

  async save() {
    await this.#api.saveConfig({
      active_model:    this.activeModel,
      system_prompt:   document.getElementById('system-prompt').value,
      claude_base_url: document.getElementById('claude-base-url').value,
      gemini_model:    document.getElementById('gemini-model').value,
      claude_model:    document.getElementById('claude-model').value,
      chatgpt_model:   document.getElementById('chatgpt-model').value,
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
    ['gemini', 'claude', 'chatgpt'].forEach(m => {
      const btn = document.getElementById('btn-' + m);
      if (btn) btn.className = `${BASE} ${this.activeModel === m ? ON : OFF}`;
    });

    const geminiLabel  = document.getElementById('gemini-model')?.value?.replace('models/', '') || 'Gemini';
    const claudeLabel  = document.getElementById('claude-model')?.value  || 'Claude';
    const chatgptLabel = document.getElementById('chatgpt-model')?.value || 'GPT-4o';
    const labelMap     = { gemini: `🌟 ${geminiLabel}`, claude: `✳️ ${claudeLabel}`, chatgpt: `🤖 ${chatgptLabel}` };
    const label = document.getElementById('current-model-label');
    if (label) label.textContent = labelMap[this.activeModel] || this.activeModel;

    this.#toggleSections(this.activeModel);
  }

  #toggleSections(model) {
    document.getElementById('gemini-model-wrap').style.display    = model === 'gemini'  ? 'block' : 'none';
    document.getElementById('claude-model-wrap').style.display    = model === 'claude'  ? 'block' : 'none';
    document.getElementById('claude-base-url-wrap').style.display = model === 'claude'  ? 'block' : 'none';
    document.getElementById('chatgpt-model-wrap').style.display   = model === 'chatgpt' ? 'block' : 'none';
  }
}
