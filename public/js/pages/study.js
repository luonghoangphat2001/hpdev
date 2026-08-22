import { escapeHtml } from '../utils.js';
import { encodeActionArgs } from '../app/events.js';

export class StudyPage {
  #api;
  #editingId = null;

  constructor(api) {
    this.#api = api;
  }

  async load() {
    const includeInactive = document.getElementById('study-include-inactive')?.checked || false;
    const data = await this.#api.getStudySchedules(includeInactive);
    this.#render(data.schedules || []);
  }

  async save() {
    const payload = {
      user_id: document.getElementById('study-user-id').value.trim(),
      username: document.getElementById('study-username').value.trim(),
      platform: document.getElementById('study-platform').value,
      channel_id: document.getElementById('study-channel-id').value.trim(),
      title: document.getElementById('study-title').value.trim(),
      remind_at: this.#datetimeValue(),
      repeat_type: document.getElementById('study-repeat').value,
      is_active: document.getElementById('study-active').checked ? 1 : 0,
    };
    const result = this.#editingId
      ? await this.#api.updateStudySchedule(this.#editingId, payload)
      : await this.#api.createStudySchedule(payload);
    this.#message(result.ok ? 'Đã lưu lịch.' : (result.error || 'Không lưu được.'), !!result.ok);
    if (result.ok) {
      this.clearForm();
      await this.load();
    }
  }

  edit(id, data) {
    this.#editingId = id;
    document.getElementById('study-form-title').textContent = `Sửa lịch #${id}`;
    document.getElementById('study-user-id').value = data.user_id || '';
    document.getElementById('study-username').value = data.username || '';
    document.getElementById('study-platform').value = data.platform || 'discord';
    document.getElementById('study-channel-id').value = data.channel_id || '';
    document.getElementById('study-title').value = data.title || '';
    document.getElementById('study-remind-at').value = String(data.remind_at || '').replace(' ', 'T').slice(0, 16);
    document.getElementById('study-repeat').value = data.repeat_type || 'none';
    document.getElementById('study-active').checked = Number(data.is_active) === 1;
    document.getElementById('study-save-btn').textContent = 'Update';
  }

  async delete(id) {
    if (!confirm(`Xóa lịch #${id}?`)) return;
    const result = await this.#api.deleteStudySchedule(id);
    this.#message(result.ok ? 'Đã xóa lịch.' : 'Không xóa được.', !!result.ok);
    await this.load();
  }

  clearForm() {
    this.#editingId = null;
    document.getElementById('study-form-title').textContent = 'Thêm lịch học';
    document.getElementById('study-user-id').value = '';
    document.getElementById('study-username').value = '';
    document.getElementById('study-platform').value = 'discord';
    document.getElementById('study-channel-id').value = '';
    document.getElementById('study-title').value = '';
    document.getElementById('study-remind-at').value = '';
    document.getElementById('study-repeat').value = 'none';
    document.getElementById('study-active').checked = true;
    document.getElementById('study-save-btn').textContent = 'Add';
  }

  #render(rows) {
    const el = document.getElementById('study-table-body') || document.getElementById('study-list');
    if (!el) return;
    if (!rows.length) {
      el.innerHTML = el.id === 'study-table-body'
        ? '<tr><td colspan="5" class="px-4 py-6 text-center text-gray-400 text-sm">Chưa có lịch nào.</td></tr>'
        : '<div class="p-6 text-gray-400 text-sm">Chưa có lịch nào.</div>';
      return;
    }

    if (el.id === 'study-table-body') {
      el.innerHTML = rows.map((row) => {
        return `<tr class="border-b border-gray-700">
          <td class="px-4 py-3 font-semibold">${escapeHtml(row.title)}</td>
          <td class="px-4 py-3">${escapeHtml(row.platform || '')}</td>
          <td class="px-4 py-3">${escapeHtml(row.remind_at || '')}</td>
          <td class="px-4 py-3">${escapeHtml(row.repeat_type || '')}</td>
          <td class="px-4 py-3 space-x-2">
            <button data-action="study.edit" data-action-args="${encodeActionArgs(row.id, row)}" class="text-indigo-400 hover:text-indigo-300">Sửa</button>
            <button data-action="study.delete" data-action-args="${encodeActionArgs(row.id)}" class="text-red-400 hover:text-red-300">Xóa</button>
          </td>
        </tr>`;
      }).join('');
      return;
    }

    el.innerHTML = rows.map((row) => {
      const status = Number(row.is_active) === 1
        ? '<span class="text-green-400">active</span>'
        : '<span class="text-gray-500">inactive</span>';
      return `
        <div class="px-4 py-3 border-b border-gray-700 last:border-0 flex items-center gap-3">
          <div class="w-14 text-xs text-gray-500">#${row.id}</div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-gray-200 truncate">${escapeHtml(row.title)}</div>
            <div class="text-xs text-gray-500 mt-1">
              ${escapeHtml(row.remind_at)} · ${escapeHtml(row.repeat_type)} · ${escapeHtml(row.platform || '')} · ${status}
            </div>
            <div class="text-xs text-gray-600 mt-1">
              user: ${escapeHtml(row.username || row.user_id || '')} · channel: ${escapeHtml(row.channel_id || 'default')}
            </div>
          </div>
          <button data-action="study.edit" data-action-args="${encodeActionArgs(row.id, row)}"
            class="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-gray-700 transition">Sửa</button>
          <button data-action="study.delete" data-action-args="${encodeActionArgs(row.id)}"
            class="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-700 transition">Xóa</button>
        </div>`;
    }).join('');
  }

  #datetimeValue() {
    const value = document.getElementById('study-remind-at').value;
    return value ? `${value.replace('T', ' ')}:00` : '';
  }

  #message(text, ok) {
    const el = document.getElementById('study-msg');
    el.className = `text-sm ${ok ? 'text-green-400' : 'text-red-400'}`;
    el.textContent = text;
    el.classList.remove('hidden');
  }
}
