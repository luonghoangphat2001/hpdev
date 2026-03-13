import { escapeHtml } from '../utils.js';

export class UsersPage {
  #api;
  #getMe;   // () => string  (current username)

  constructor(api, getMe) {
    this.#api   = api;
    this.#getMe = getMe;
  }

  async load() {
    const data      = await this.#api.getUsers();
    const container = document.getElementById('user-list');

    if (!data.length) {
      container.innerHTML = '<p class="text-gray-500 text-sm py-2">Chưa có user nào.</p>';
      return;
    }

    const me = this.#getMe();
    container.innerHTML = data.map(u => {
      const lastActive = u.last_active ? this.#formatRelative(new Date(u.last_active)) : 'Chưa online';
      const isOnline   = u.last_active && (Date.now() - new Date(u.last_active).getTime()) < 5 * 60 * 1000;

      return `
        <div class="flex items-center gap-3 py-2.5 border-b border-gray-700 last:border-0">
          <div class="w-7 h-7 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold shrink-0">
            ${escapeHtml(u.username.charAt(0).toUpperCase())}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium flex items-center gap-1.5">
              ${escapeHtml(u.username)}
              ${u.username === me ? '<span class="text-xs text-gray-500">(bạn)</span>' : ''}
              ${isOnline ? '<span class="w-2 h-2 rounded-full bg-green-400 inline-block" title="Online"></span>' : ''}
            </div>
            <div class="text-xs text-gray-500">
              ${u.role} · ${new Date(u.created_at).toLocaleDateString('vi-VN')} · ${lastActive}
            </div>
          </div>
          ${u.username !== me
            ? `<button onclick="window._deleteUser('${escapeHtml(u.username)}')"
                class="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-700 transition">Xóa</button>`
            : ''}
        </div>`;
    }).join('');
  }

  async add() {
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-user-password').value;
    const role     = document.getElementById('new-user-role').value;
    const msgEl    = document.getElementById('add-user-msg');

    const data = await this.#api.addUser(username, password, role);
    msgEl.className  = 'text-sm ' + (data.ok ? 'text-green-400' : 'text-red-400');
    msgEl.textContent = data.ok ? '✓ Đã thêm!' : '✗ ' + (data.error || 'Failed');
    msgEl.classList.remove('hidden');

    if (data.ok) {
      document.getElementById('new-username').value      = '';
      document.getElementById('new-user-password').value = '';
      await this.load();
    }
  }

  async delete(username) {
    if (!confirm(`Xóa user "${username}"?`)) return;
    const data = await this.#api.deleteUser(username);
    if (data.ok) await this.load();
    else alert(data.error || 'Failed');
  }

  // ── Private ─────────────────────────────────────────────
  #formatRelative(date) {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60)    return 'vừa xong';
    if (s < 3600)  return `${Math.floor(s / 60)} phút trước`;
    if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
    return `${Math.floor(s / 86400)} ngày trước`;
  }
}
