import { ADDITIONAL_MODELS } from './constants.js';

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

export async function loadModelOptions(api) {
  const providers = [
    'gemini',
    'claude',
    'chatgpt',
    ...ADDITIONAL_MODELS.map(({ key }) => key),
  ];

  const responses = await Promise.all(
    providers.map((provider) => {
      return api.getModels(provider).catch(() => {
        return { models: [], disabled: true, unavailable: true, selection_disabled: true };
      });
    })
  );

  const options = {};
  const disabledMap = {};
  const unavailableMap = {};
  providers.forEach((provider, idx) => {
    const resp = responses[idx];
    options[provider] = resp.models || [];
    disabledMap[provider] = resp.selection_disabled === true || resp.unavailable === true;
    unavailableMap[provider] = !!(resp.unavailable || resp.disabled || resp.fallback || resp.error);
  });

  const providersWithModelOptions = [
    'gemini',
    'claude',
    'chatgpt',
  ];

  for (const provider of providersWithModelOptions) {
    if (options[provider] && options[provider].length > 0) {
      populateSelect(`${provider}-model`, options[provider]);
    }
    if (unavailableMap[provider]) {
      const sel = document.getElementById(`${provider}-model`);
      if (sel) {
        sel.disabled = false;
        const note = document.createElement('span');
        note.className = 'block mt-2 text-xs text-red-400 provider-status-note';
        note.textContent = '⛔ Provider không phản hồi — không sử dụng model dự phòng. Hãy sửa cấu hình rồi tải lại.';
        sel.parentNode.appendChild(note);
      }
    }
  }

  options.disabledProviders = disabledMap;
  options.unavailableProviders = unavailableMap;
  return options;
}

export function populateSelect(selectId, models) {
  const sel = document.getElementById(selectId);
  if (!sel) {
    return;
  }

  const current = sel.value;
  sel.innerHTML = '';
  for (const { id, label } of models) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = label;
    sel.appendChild(opt);
  }

  if (current && [...sel.options].some((o) => o.value === current)) {
    sel.value = current;
  }
}

export function selectOrAdd(selectId, value) {
  const sel = document.getElementById(selectId);
  if (!sel) {
    return;
  }

  if (![...sel.options].some((o) => o.value === value)) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    sel.appendChild(opt);
  }
  sel.value = value;
}

export function renderAdditionalModels(data, modelOptions = {}) {
  const root = document.getElementById('additional-model-config');
  if (!root) {
    return;
  }

  root.innerHTML = ADDITIONAL_MODELS
    .map(({ key, label, modelKey, placeholder }) => {
      const current = data[modelKey] || '';
      const fallbackOptions = [
        {
          id: current || placeholder,
          label: current || placeholder,
        },
      ];

      const options = modelOptions[key] && modelOptions[key].length > 0
        ? modelOptions[key]
        : fallbackOptions;

      const optionHtml = options.some((option) => option.id === current)
        ? options
        : [
          { id: current, label: current },
          ...options,
        ].filter((option) => option.id);

      const renderedOptions = optionHtml
        .map((option) => {
          const isSelected = option.id === current ? ' selected' : '';
          return `<option value="${escapeAttr(option.id)}"${isSelected}>${escapeAttr(option.label || option.id)}</option>`;
        })
        .join('');

      return `
        <label class="block">
          <span class="block text-xs text-gray-400 mb-1">${label}</span>
          <select id="${modelKey}" class="w-full px-4 py-2.5 bg-gray-700 rounded-lg border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm">
            ${renderedOptions}
          </select>
        </label>`;
    })
    .join('');
}
