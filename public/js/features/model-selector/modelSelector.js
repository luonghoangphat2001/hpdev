import { registerActionTarget } from '../../app/events.js';
import { PROVIDER_ORDER, getProviderMeta } from '../../providerCatalog.js';

export class ModelSelector {
  #loadChat;
  #getProviders;

  constructor({ loadChat, getProviders }) {
    this.#loadChat = loadChat;
    this.#getProviders = getProviders;
    registerActionTarget('modelSelector', this);
  }

  toggle() {
    const dropdown = document.getElementById('model-dropdown');
    const overlay = document.getElementById('overlay');
    const shouldOpen = dropdown?.classList.contains('hidden');
    dropdown?.classList.toggle('hidden', !shouldOpen);
    overlay?.classList.toggle('hidden', !shouldOpen);
  }

  close() {
    document.getElementById('model-dropdown')?.classList.add('hidden');
    document.getElementById('overlay')?.classList.add('hidden');
  }

  async select(model) {
    const chat = await this.#loadChat();
    chat.model = model;
    this.close();
    this.render(model);
  }

  render(model) {
    const meta = getProviderMeta(model);
    const modelSelect = document.getElementById(`${model}-model`);
    const selectedOption = modelSelect?.options[modelSelect.selectedIndex];
    const icon = document.getElementById('model-icon');
    const label = document.getElementById('model-display');

    if (icon) {
      icon.textContent = meta.icon;
    }

    if (label) {
      label.textContent = selectedOption?.text || meta.display;
    }

    const configuredProviders = this.#getProviders();
    const providerKeys = configuredProviders?.length
      ? configuredProviders.map((provider) => provider.key || provider.id).filter(Boolean)
      : PROVIDER_ORDER;

    for (const providerKey of providerKeys) {
      document
        .getElementById(`check-${providerKey}`)
        ?.classList.toggle('hidden', providerKey !== model);
    }
  }
}
