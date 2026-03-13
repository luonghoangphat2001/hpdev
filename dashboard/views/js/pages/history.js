import { escapeHtml } from '../utils.js';

export class HistoryPage {
  #api;

  constructor(api) {
    this.#api = api;
  }

  async load() {
    const data      = await this.#api.getHistory(50);
    const container = document.getElementById('history-list');

    if (!data.length) {
      container.innerHTML = '<p class="text-gray-500 text-center py-8">Chưa có tin nhắn nào.</p>';
      return;
    }

    container.innerHTML = data.map(m => `
      <div class="flex gap-3 p-3 rounded-lg bg-gray-800">
        <span class="shrink-0 font-semibold ${m.role === 'user' ? 'text-blue-400' : 'text-amber-400'}">
          ${m.role === 'user' ? '👤 ' + escapeHtml(m.username) : '🤖 Đần'}
        </span>
        <span class="text-gray-300 break-words min-w-0 text-sm">${escapeHtml(m.content)}</span>
        <span class="ml-auto shrink-0 text-gray-500 text-xs whitespace-nowrap">
          ${new Date(m.created_at).toLocaleString('vi-VN')}
        </span>
      </div>`).join('');
  }
}
