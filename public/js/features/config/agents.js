import { OPENCLAW_AGENTS } from './constants.js';

function escapeAttr(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': {
        return '&amp;';
      }
      case '<': {
        return '&lt;';
      }
      case '>': {
        return '&gt;';
      }
      case '"': {
        return '&quot;';
      }
      case "'": {
        return '&#39;';
      }
      default: {
        return char;
      }
    }
  });
}

export function readAgentModel(agent, role) {
  const provider = document.getElementById(`agent-${agent}-${role}-provider`)?.value || 'gemini';
  const model = document.getElementById(`agent-${agent}-${role}-model`)?.value.trim() || '';
  return `${provider}:${model}`;
}

export function renderOpenClawAgentModels(data, providers, modelOptions = {}) {
  const root = document.getElementById('openclaw-agent-model-config');
  if (!root) {
    return;
  }

  const providerOptions = providers
    .map((provider) => {
      const key = provider.key || provider.id;
      const label = provider.label || provider.display || key;
      return `<option value="${escapeAttr(key)}">${escapeAttr(label)}</option>`;
    })
    .join('');

  root.innerHTML = OPENCLAW_AGENTS
    .map(([agent, label]) => {
      const fields = [
        'primary',
        'fallback',
      ]
        .map((role) => {
          return `
            <label class="text-xs text-gray-400">
              ${role === 'primary' ? 'Primary' : 'Fallback'}
              <div class="flex gap-2 mt-1">
                <select id="agent-${agent}-${role}-provider" class="w-1/3 px-2 py-2 bg-gray-700 rounded border border-gray-600 text-xs">
                  ${providerOptions}
                </select>
                <select id="agent-${agent}-${role}-model" data-agent-model-provider="agent-${agent}-${role}-provider" class="flex-1 min-w-0 px-2 py-2 bg-gray-700 rounded border border-gray-600 text-xs"></select>
              </div>
            </label>`;
        })
        .join('');

      return `
        <div class="rounded-lg border border-gray-700 p-4">
          <div class="font-semibold text-sm text-gray-200 mb-3">${label} <span class="text-gray-500">(${agent})</span></div>
          <div class="grid md:grid-cols-2 gap-3">${fields}</div>
        </div>`;
    })
    .join('');

  for (const [agent] of OPENCLAW_AGENTS) {
    for (const role of ['primary', 'fallback']) {
      const raw = data[`agent_${agent}_${role}`] || 'gemini:models/gemini-2.5-flash';
      const separator = raw.indexOf(':');
      const provider = separator > 0 ? raw.slice(0, separator) : 'gemini';
      const preferred = separator > 0 ? raw.slice(separator + 1) : raw;

      const providerSelect = document.getElementById(`agent-${agent}-${role}-provider`);
      if (providerSelect) {
        providerSelect.value = provider;
        refreshAgentModelSelect(agent, role, modelOptions, preferred);
        providerSelect.addEventListener('change', () => {
          refreshAgentModelSelect(agent, role, modelOptions);
        });
      }
    }
  }
}

export function refreshAgentModelSelect(agent, role, modelOptions = {}, preferred = '') {
  const provider = document.getElementById(`agent-${agent}-${role}-provider`)?.value || 'gemini';
  const select = document.getElementById(`agent-${agent}-${role}-model`);
  if (!select) {
    return;
  }

  const fallbackMap = {
    gemini: [
      'models/gemini-2.5-flash',
      'models/gemini-2.0-flash',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-flash',
    ],
    claude: [
      'claude-sonnet-4-6',
      'claude-opus-4-6',
      'claude-haiku-4-5-20251001',
    ],
    chatgpt: [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
    ],
  };

  const fallback = fallbackMap[provider] || [];
  const fetched = (modelOptions[provider] || []).map((item) => {
    return item.id || item;
  });

  const models = [
    ...new Set([
      ...fetched,
      ...fallback,
      preferred,
    ].filter(Boolean)),
  ];

  select.innerHTML = models
    .map((model) => {
      return `<option value="${escapeAttr(model)}">${escapeAttr(model)}</option>`;
    })
    .join('');

  if (preferred && models.includes(preferred)) {
    select.value = preferred;
  }
}
