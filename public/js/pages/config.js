import { PROVIDER_ORDER, getProviderMeta } from '../providerCatalog.js';
import { ADDITIONAL_MODELS, OPENCLAW_AGENTS } from '../features/config/constants.js';
import { fillPromptTemplate, fillAllPromptTemplates, clearPromptField, populatePromptFields } from '../features/config/prompts.js';
import { renderOpenClawAgentModels, readAgentModel } from '../features/config/agents.js';
import { loadModelOptions, renderAdditionalModels, selectOrAdd } from '../features/config/providers.js';
import { configRoutes } from '../app/routes/config.js';

export class ConfigPage {
  #api;
  #onModelChange;

  activeModel = 'gemini';
  learningActiveModel = 'gemini';
  discordActiveModel = 'claude';
  telegramActiveModel = 'gemini';
  providers = [];
  modelOptions = {};
  disabledProviders = {};
  activeTab = 'models';

  constructor(api, onModelChange) {
    this.#api = api;
    this.#onModelChange = onModelChange || (() => {});
  }

  switchTab(tabId, { updateUrl = true } = {}) {
    const targetTab = configRoutes.normalizeTab(tabId);
    this.activeTab = targetTab;

    document.querySelectorAll('.config-tab-panel').forEach((panel) => {
      panel.classList.add('hidden');
    });

    document.querySelectorAll('.config-tab-btn').forEach((btn) => {
      btn.classList.remove('border-indigo-500', 'text-indigo-400');
      btn.classList.add('border-transparent', 'text-gray-400');
    });

    const targetPanel = document.getElementById(`tab-panel-${targetTab}`);
    if (targetPanel) {
      targetPanel.classList.remove('hidden');
    }

    const targetBtn = document.querySelector(`[data-config-tab="${targetTab}"]`);
    if (targetBtn) {
      targetBtn.classList.remove('border-transparent', 'text-gray-400');
      targetBtn.classList.add('border-indigo-500', 'text-indigo-400');
    }

    document.querySelectorAll('[data-config-sidebar-tab]').forEach((link) => {
      const active = link.dataset.configSidebarTab === targetTab;
      link.classList.toggle('bg-indigo-600/20', active);
      link.classList.toggle('text-indigo-300', active);
      link.classList.toggle('text-gray-400', !active);
      link.setAttribute('aria-current', active ? 'page' : 'false');
    });

    if (updateUrl) {
      const targetPath = configRoutes.build(targetTab);
      if (globalThis.location.pathname !== targetPath) {
        globalThis.history.pushState(null, '', targetPath);
      }
    }
  }

  fillPromptTemplate(fieldId) {
    fillPromptTemplate(fieldId);
  }

  fillAllPromptTemplates() {
    fillAllPromptTemplates();
  }

  clearPromptField(fieldId) {
    clearPromptField(fieldId);
  }

  // ── Public ──────────────────────────────────────────────
  async load() {
    const [data, modelOptions] = await Promise.all([
      this.#api.getConfig(),
      loadModelOptions(this.#api),
    ]);

    this.activeModel = data.active_model || 'gemini';
    this.learningActiveModel = data.learning_active_model || this.activeModel;
    this.discordActiveModel = data.discord_active_model || 'claude';
    this.telegramActiveModel = data.telegram_active_model || 'gemini';

    if (Array.isArray(data.ai_providers) && data.ai_providers.length > 0) {
      this.providers = data.ai_providers;
    } else {
      this.providers = PROVIDER_ORDER.map((key) => {
        return getProviderMeta(key);
      });
    }

    this.modelOptions = modelOptions;
    this.disabledProviders = modelOptions.disabledProviders || {};

    const systemPromptEl = document.getElementById('system-prompt');
    if (systemPromptEl) {
      systemPromptEl.value = data.system_prompt || '';
    }

    const claudeBaseUrlEl = document.getElementById('claude-base-url');
    if (claudeBaseUrlEl) {
      claudeBaseUrlEl.value = data.claude_base_url || '';
    }

    if (data.gemini_model) {
      selectOrAdd('gemini-model', data.gemini_model);
    }

    if (data.claude_model) {
      selectOrAdd('claude-model', data.claude_model);
    }

    if (data.chatgpt_model) {
      selectOrAdd('chatgpt-model', data.chatgpt_model);
    }

    renderAdditionalModels(data, modelOptions);
    renderOpenClawAgentModels(data, this.providers, modelOptions);

    const ocEnabled = document.getElementById('openclaw-enabled');
    if (ocEnabled) {
      ocEnabled.checked = data.openclaw_enabled === 'true';
    }

    const ocUrl = document.getElementById('openclaw-url');
    if (ocUrl) {
      ocUrl.value = data.openclaw_url || '';
    }

    const ocCx = document.getElementById('google-cx');
    if (ocCx) {
      ocCx.value = data.google_cx || '';
    }

    const logRetentionInput = document.getElementById('log-retention-days');
    if (logRetentionInput) {
      logRetentionInput.value = data.log_retention_days || 14;
    }

    populatePromptFields(data);

    this.#renderProviderControls();
    this.#updateUI();
    this.#onModelChange(this.activeModel);

    this.switchTab(configRoutes.parse(), { updateUrl: false });
    const canonicalPath = configRoutes.build(this.activeTab);
    if (globalThis.location.pathname !== canonicalPath) {
      globalThis.history.replaceState(null, '', canonicalPath);
    }

    return data;
  }

  setLogRetentionDays(days) {
    const input = document.getElementById('log-retention-days');
    if (input) {
      input.value = days;
    }
  }

  async cleanLogsNow() {
    const days = document.getElementById('log-retention-days')?.value || 14;
    const msgEl = document.getElementById('clean-logs-msg');

    try {
      const { cleanLogs } = await import('../api/logs.js');
      const res = await cleanLogs(days);
      if (msgEl) {
        msgEl.className = 'text-xs font-medium text-green-400';
        msgEl.textContent = `✓ Đã dọn dẹp ${res.deletedCount || 0} file log cũ (> ${res.retentionDays || days} ngày)`;
        msgEl.classList.remove('hidden');
        setTimeout(() => {
          msgEl.classList.add('hidden');
        }, 5000);
      }
    } catch (err) {
      if (msgEl) {
        msgEl.className = 'text-xs font-medium text-red-400';
        msgEl.textContent = `✗ Lỗi dọn dẹp: ${err.message}`;
        msgEl.classList.remove('hidden');
      }
    }
  }

  async setDefaultModel(model, platform) {
    if (this.disabledProviders[model]) {
      alert(`${getProviderMeta(model).label || model} đang tạm ngưng. Bạn vẫn có thể đổi model trong mục Providers.`);
      return;
    }
    if (platform === 'discord') {
      this.discordActiveModel = model;
      await this.#api.saveConfig({
        discord_active_model: model,
      });
    } else if (platform === 'telegram') {
      this.telegramActiveModel = model;
      await this.#api.saveConfig({
        telegram_active_model: model,
      });
    } else if (platform === 'learning') {
      this.learningActiveModel = model;
      await this.#api.saveConfig({
        learning_active_model: model,
      });
    } else {
      this.activeModel = model;
      this.#onModelChange(model);
      await this.#api.saveConfig({
        active_model: model,
      });
    }
    this.#updateUI();
  }

  async save() {
    const additionalModelValues = Object.fromEntries(
      ADDITIONAL_MODELS.map(({ modelKey }) => {
        return [
          modelKey,
          document.getElementById(modelKey)?.value || '',
        ];
      })
    );

    const openClawAgentValues = Object.fromEntries(
      OPENCLAW_AGENTS.flatMap(([agent]) => {
        return [
          'primary',
          'fallback',
        ].map((role) => {
          return [
            `agent_${agent}_${role}`,
            readAgentModel(agent, role),
          ];
        });
      })
    );

    await this.#api.saveConfig({
      active_model: this.activeModel,
      learning_active_model: this.learningActiveModel,
      discord_active_model: this.discordActiveModel,
      telegram_active_model: this.telegramActiveModel,
      system_prompt: document.getElementById('system-prompt')?.value || '',
      claude_base_url: document.getElementById('claude-base-url')?.value || '',
      gemini_model: document.getElementById('gemini-model')?.value || '',
      claude_model: document.getElementById('claude-model')?.value || '',
      chatgpt_model: document.getElementById('chatgpt-model')?.value || '',
      ...additionalModelValues,
      ...openClawAgentValues,
      openclaw_enabled: document.getElementById('openclaw-enabled')?.checked ? 'true' : 'false',
      openclaw_url: document.getElementById('openclaw-url')?.value || '',
      google_cx: document.getElementById('google-cx')?.value || '',
      learning_prompt_tech: document.getElementById('prompt-learning-tech')?.value ?? '',
      learning_prompt_vocab: document.getElementById('prompt-learning-vocab')?.value ?? '',
      learning_prompt_quiz: document.getElementById('prompt-learning-quiz')?.value ?? '',
      learning_prompt_reading: document.getElementById('prompt-learning-reading')?.value ?? '',
      learning_prompt_writing: document.getElementById('prompt-learning-writing')?.value ?? '',
      learning_prompt_speaking: document.getElementById('prompt-learning-speaking')?.value ?? '',
      learning_prompt_ielts: document.getElementById('prompt-learning-ielts')?.value ?? '',
      learning_prompt_eval_tech: document.getElementById('prompt-learning-eval-tech')?.value ?? '',
      learning_prompt_eval_reading: document.getElementById('prompt-learning-eval-reading')?.value ?? '',
      learning_prompt_eval_writing: document.getElementById('prompt-learning-eval-writing')?.value ?? '',
      learning_prompt_eval_speaking: document.getElementById('prompt-learning-eval-speaking')?.value ?? '',
      learning_prompt_eval_ielts: document.getElementById('prompt-learning-eval-ielts')?.value ?? '',
    });

    this.#updateUI();
    const msg = document.getElementById('save-msg');
    if (msg) {
      msg.classList.remove('hidden');
      setTimeout(() => {
        msg.classList.add('hidden');
      }, 2500);
    }
  }

  // ── Private ─────────────────────────────────────────────
  #renderProviderControls() {
    const dropdown = document.getElementById('model-dropdown-options');
    const discord = document.getElementById('discord-model-buttons');
    const telegram = document.getElementById('telegram-model-buttons');
    const learning = document.getElementById('learning-model-buttons');
    const web = document.getElementById('web-model-buttons');

    const providers = this.providers.length > 0
      ? this.providers
      : PROVIDER_ORDER.map((key) => {
        return getProviderMeta(key);
      });

    if (dropdown) {
      dropdown.innerHTML = providers
        .map((provider) => {
          const id = provider.key || provider.id;
          const display = provider.display || provider.label || id;
          const shortLabel = provider.shortLabel || provider.label || id;
          const disabled = !!this.disabledProviders[id];
          return `
            <button ${disabled ? 'disabled aria-disabled="true"' : ''} data-action="modelSelector.select" data-action-args='["${id}"]' id="model-opt-${id}"
              class="w-full px-3 py-3 rounded-lg text-left transition flex items-center gap-3 group ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-700'}">
              <span class="text-lg">${provider.icon || '🤖'}</span>
              <div class="flex-1">
                <div class="font-semibold text-sm text-white">${display}</div>
                <div class="text-xs ${disabled ? 'text-amber-400' : 'text-gray-400'}">${disabled ? 'Tạm ngưng' : shortLabel}</div>
              </div>
              <svg id="check-${id}" class="w-4 h-4 text-indigo-400 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </button>`;
        })
        .join('');
    }

    const buttonHtml = (platform) => {
      return providers
        .map((provider) => {
          const id = provider.key || provider.id;
          const shortLabel = provider.shortLabel || provider.label || id;
          const icon = provider.icon || '🤖';
          const disabled = !!this.disabledProviders[id];
          return `
            <button ${disabled ? 'disabled aria-disabled="true"' : ''} data-action="config.setDefaultModel" data-action-args='["${id}","${platform}"]' id="btn-${platform}-${id}"
              title="${disabled ? 'Provider đang tạm ngưng; cấu hình model vẫn chỉnh được trong Providers' : shortLabel}"
              class="p-3.5 rounded-xl font-semibold border-2 transition-all flex flex-col items-center justify-center gap-1.5 text-xs ${disabled ? 'cursor-not-allowed opacity-40 border-amber-900/60 bg-gray-900 text-gray-500' : 'cursor-pointer border-gray-700/80 bg-gray-800/60 text-gray-400 hover:border-gray-500 hover:text-gray-200'}">
              <span class="text-xl">${icon}</span>
              <span class="font-medium text-center truncate max-w-full">${shortLabel}</span>
              ${disabled ? '<span class="text-[9px] text-amber-500">Tạm ngưng</span>' : ''}
            </button>`;
        })
        .join('');
    };

    if (discord) {
      discord.innerHTML = buttonHtml('discord');
    }
    if (telegram) {
      telegram.innerHTML = buttonHtml('telegram');
    }
    if (learning) {
      learning.innerHTML = buttonHtml('learning');
    }
    if (web) {
      web.innerHTML = buttonHtml('web');
    }
  }

  #updateUI() {
    const ON = 'border-indigo-500 bg-indigo-900/60 text-white shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500';
    const OFF = 'border-gray-700/80 bg-gray-800/60 text-gray-400 hover:border-gray-500 hover:text-gray-200';
    const BASE = 'p-3.5 rounded-xl font-semibold border-2 transition-all flex flex-col items-center justify-center gap-1.5 text-xs cursor-pointer';

    for (const m of PROVIDER_ORDER) {
      const disabled = !!this.disabledProviders[m];
      const d = document.getElementById(`btn-discord-${m}`);
      if (d) {
        d.disabled = disabled;
        d.className = `${BASE} ${disabled ? 'opacity-40 cursor-not-allowed border-amber-900/60 bg-gray-900 text-gray-500' : (this.discordActiveModel === m ? ON : OFF)}`;
      }

      const t = document.getElementById(`btn-telegram-${m}`);
      if (t) {
        t.disabled = disabled;
        t.className = `${BASE} ${disabled ? 'opacity-40 cursor-not-allowed border-amber-900/60 bg-gray-900 text-gray-500' : (this.telegramActiveModel === m ? ON : OFF)}`;
      }

      const l = document.getElementById(`btn-learning-${m}`);
      if (l) {
        l.disabled = disabled;
        l.className = `${BASE} ${disabled ? 'opacity-40 cursor-not-allowed border-amber-900/60 bg-gray-900 text-gray-500' : (this.learningActiveModel === m ? ON : OFF)}`;
      }

      const w = document.getElementById(`btn-web-${m}`);
      if (w) {
        w.disabled = disabled;
        w.className = `${BASE} ${disabled ? 'opacity-40 cursor-not-allowed border-amber-900/60 bg-gray-900 text-gray-500' : (this.activeModel === m ? ON : OFF)}`;
      }
    }

    const dl = document.getElementById('discord-model-label');
    if (dl) {
      dl.textContent = getProviderMeta(this.discordActiveModel).display || this.discordActiveModel;
    }

    const tl = document.getElementById('telegram-model-label');
    if (tl) {
      tl.textContent = getProviderMeta(this.telegramActiveModel).display || this.telegramActiveModel;
    }

    const ll = document.getElementById('learning-model-label');
    if (ll) {
      ll.textContent = getProviderMeta(this.learningActiveModel).display || this.learningActiveModel;
    }

    const wl = document.getElementById('web-model-label');
    if (wl) {
      wl.textContent = getProviderMeta(this.activeModel).display || this.activeModel;
    }
  }
}
