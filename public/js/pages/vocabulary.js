import { escapeHtml } from '../utils.js';
import { encodeActionArgs } from '../app/events.js';

export class VocabularyPage {
  #api;
  #topicNo = 1;

  constructor(api) {
    this.#api = api;
  }

  async load() {
    const [config, topics, words, history] = await Promise.all([
      this.#api.getVocabularyConfig(),
      this.#api.getVocabularyTopics(),
      this.#api.getVocabularyWords(this.#topicNo),
      this.#api.getVocabularyHistory(),
    ]);
    this.#renderConfig(config);
    this.#renderTopics(topics.topics || []);
    this.#renderWords(words.words || []);
    this.#renderHistory(history.logs || []);
  }

  async saveConfig() {
    const result = await this.#api.saveVocabularyConfig({
      enabled: document.getElementById('vocab-enabled').checked,
      daily_time: document.getElementById('vocab-daily-time').value || '08:00',
      words_per_day: document.getElementById('vocab-words-per-day').value || 5,
      discord_channel_id: document.getElementById('vocab-channel-id').value.trim(),
      topic_mode: document.getElementById('vocab-topic-mode').value,
      current_topic_no: document.getElementById('vocab-current-topic').value || 1,
    });
    this.#message(result.ok ? 'Đã lưu cấu hình từ vựng.' : 'Không lưu được cấu hình.', !!result.ok);
    await this.load();
  }

  async selectTopic(topicNo) {
    this.#topicNo = Number(topicNo) || 1;
    const [topicsRes, wordsRes] = await Promise.all([
      this.#api.getVocabularyTopics(),
      this.#api.getVocabularyWords(this.#topicNo),
    ]);
    this.#renderTopics(topicsRes.topics || []);
    this.#renderWords(wordsRes.words || []);
    const selectEl = document.getElementById('vocab-word-topic');
    if (selectEl) selectEl.value = String(this.#topicNo);
  }

  async saveTopic(topicNo) {
    const name = document.getElementById(`vocab-topic-name-${topicNo}`).value.trim();
    const isActive = document.getElementById(`vocab-topic-active-${topicNo}`).checked ? 1 : 0;
    const result = await this.#api.updateVocabularyTopic(topicNo, { name, is_active: isActive });
    this.#message(result.ok ? `Đã lưu chủ đề ${topicNo}.` : 'Không lưu được chủ đề.', !!result.ok);
    await this.load();
  }

  async addWord() {
    const payload = {
      topic_no: document.getElementById('vocab-word-topic').value,
      word: document.getElementById('vocab-word').value.trim(),
      meaning: document.getElementById('vocab-meaning').value.trim(),
      pronunciation: document.getElementById('vocab-pronunciation').value.trim(),
      example: document.getElementById('vocab-example').value.trim(),
      note: document.getElementById('vocab-note').value.trim(),
    };
    const result = await this.#api.createVocabularyWord(payload);
    this.#message(result.ok ? 'Đã thêm từ.' : (result.error || 'Không thêm được từ.'), !!result.ok);
    if (result.ok) {
      for (const id of ['vocab-word', 'vocab-meaning', 'vocab-pronunciation', 'vocab-example', 'vocab-note']) {
        document.getElementById(id).value = '';
      }
      await this.selectTopic(payload.topic_no);
    }
  }

  async toggleWord(id, active) {
    const result = await this.#api.updateVocabularyWord(id, { is_active: active ? 1 : 0 });
    this.#message(result.ok ? 'Đã cập nhật trạng thái từ.' : 'Không cập nhật được từ.', !!result.ok);
    await this.selectTopic(this.#topicNo);
  }

  async deleteWord(id) {
    if (!confirm(`Xóa từ #${id}?`)) return;
    const result = await this.#api.deleteVocabularyWord(id);
    this.#message(result.ok ? 'Đã xóa từ.' : 'Không xóa được từ.', !!result.ok);
    await this.selectTopic(this.#topicNo);
  }

  async importWords() {
    const input = document.getElementById('vocab-import-file');
    const file = input.files?.[0];
    if (!file) {
      this.#message('Hãy chọn file Excel trước khi import.', false);
      return;
    }

    const result = await this.#api.importVocabulary(file);
    const imported = Number(result.created || 0) + Number(result.updated || 0);
    const message = result.ok
      ? `Import ${imported} từ. ${result.errors?.length ? result.errors.join(' | ') : ''}`
      : (result.error || 'Import lỗi.');
    this.#message(message, !!result.ok && !(result.errors || []).length);
    if (result.ok) {
      input.value = '';
    }
    await this.load();
  }

  exportCurrentTopic() {
    window.location.href = this.#api.getExportVocabularyUrl(this.#topicNo);
  }

  exportAll() {
    window.location.href = this.#api.getExportVocabularyUrl('all');
  }

  async fillPronunciations() {
    this.#message('Đang tự động bổ sung phiên âm Mỹ cho các từ chưa có...', true);
    const result = await this.#api.fillVocabularyPronunciations();
    if (result.ok) {
      this.#message(`Đã bổ sung phiên âm Mỹ cho ${result.updated}/${result.total} từ.`, true);
      await this.load();
    } else {
      this.#message('Có lỗi xảy ra khi tự động lấy phiên âm.', false);
    }
  }

  async sendWordToDiscord(id) {
    this.#message(`Đang gửi từ #${id} qua Discord...`, true);
    const result = await this.#api.sendWordToDiscord(id);
    if (result.ok) {
      this.#message(result.message || `Đã gửi từ #${id} qua Discord!`, true);
      await this.selectTopic(this.#topicNo);
    } else {
      this.#message(result.error || `Không thể gửi từ #${id} qua Discord.`, false);
    }
  }

  #renderConfig(config) {
    document.getElementById('vocab-enabled').checked = !!config.enabled;
    document.getElementById('vocab-daily-time').value = config.daily_time || '08:00';
    document.getElementById('vocab-words-per-day').value = config.words_per_day || 5;
    document.getElementById('vocab-channel-id').value = config.discord_channel_id || '';
    document.getElementById('vocab-topic-mode').value = config.topic_mode || 'sequential';
    document.getElementById('vocab-current-topic').value = config.current_topic_no || 1;
    document.getElementById('vocab-last-sent').textContent = config.last_sent_date || 'Chưa gửi';
  }

  #renderTopics(topics) {
    const el = document.getElementById('vocab-topic-list');
    el.innerHTML = topics.map((topic) => {
      const activeClass = Number(topic.topic_no) === this.#topicNo ? 'border-indigo-500 bg-gray-700' : 'border-gray-700 bg-gray-800';
      return `
        <div class="border ${activeClass} rounded-lg p-3">
          <button data-action="vocabulary.selectTopic" data-action-args="${encodeActionArgs(topic.topic_no)}" class="w-full text-left">
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-sm font-semibold text-gray-200">#${topic.topic_no}</span>
              <span class="text-xs text-gray-500">${Number(topic.active_word_count || 0)}/${Number(topic.word_count || 0)} từ</span>
            </div>
          </button>
          <input id="vocab-topic-name-${topic.topic_no}" value="${escapeHtml(topic.name)}"
            class="w-full px-2 py-1.5 bg-gray-700 rounded border border-gray-600 focus:border-indigo-500 focus:outline-none text-xs mb-2" />
          <div class="flex items-center justify-between gap-2">
            <label class="flex items-center gap-1.5 text-xs text-gray-400">
              <input id="vocab-topic-active-${topic.topic_no}" type="checkbox" ${Number(topic.is_active) === 1 ? 'checked' : ''} class="accent-indigo-500" />
              Bật
            </label>
            <button data-action="vocabulary.saveTopic" data-action-args="${encodeActionArgs(topic.topic_no)}" class="text-xs text-indigo-400 hover:text-indigo-300">Lưu</button>
          </div>
        </div>`;
    }).join('');
  }

  #renderWords(words) {
    const el = document.getElementById('vocab-word-list');
    if (!words.length) {
      el.innerHTML = '<div class="p-4 text-sm text-gray-500">Chủ đề này chưa có từ.</div>';
      return;
    }
    el.innerHTML = words.map((word) => {
      const isSent = Number(word.is_sent) === 1;
      const sendDiscordBtn = isSent
        ? `<span class="text-[11px] px-2 py-1 rounded bg-green-900/40 text-green-300 border border-green-700/50 font-semibold">✓ Đã gửi Discord</span>`
        : `<button data-action="vocabulary.sendWordToDiscord" data-action-args="${encodeActionArgs(word.id)}" class="text-xs px-2 py-1 rounded bg-indigo-600/30 border border-indigo-500/50 hover:bg-indigo-600 text-indigo-300 hover:text-white transition">🚀 Gửi Discord</button>`;

      return `
        <div class="px-4 py-3 border-b border-gray-700 last:border-0 flex items-start gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-semibold text-gray-200">${escapeHtml(word.word)}</span>
              ${word.pronunciation ? `<span class="text-xs px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 font-mono">/${escapeHtml(word.pronunciation.replace(/^\/|\/$/g, ''))}/ 🇺🇸</span>` : ''}
            </div>
            <div class="text-xs text-gray-400 mt-1">${escapeHtml(word.meaning)}</div>
            ${word.example ? `<div class="text-xs text-gray-400 mt-1 italic">Ex: ${escapeHtml(word.example)}</div>` : ''}
            ${word.note ? `<div class="text-xs text-gray-500 mt-1">Note: ${escapeHtml(word.note)}</div>` : ''}
          </div>
          <div class="flex items-center gap-2">
            ${sendDiscordBtn}
            <button data-action="vocabulary.toggleWord" data-action-args="${encodeActionArgs(word.id, Number(word.is_active) === 1 ? 0 : 1)}"
              class="text-xs ${Number(word.is_active) === 1 ? 'text-green-400' : 'text-gray-500'} hover:text-indigo-300 px-2 py-1 rounded hover:bg-gray-700">
              ${Number(word.is_active) === 1 ? 'Bật' : 'Tắt'}
            </button>
            <button data-action="vocabulary.deleteWord" data-action-args="${encodeActionArgs(word.id)}"
              class="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-700">Xóa</button>
          </div>
        </div>`;
    }).join('');
  }

  #renderHistory(logs) {
    const el = document.getElementById('vocab-history');
    if (!logs.length) {
      el.innerHTML = '<div class="p-4 text-sm text-gray-500">Chưa có lịch sử gửi.</div>';
      return;
    }
    el.innerHTML = logs.map((log) => `
      <div class="px-4 py-3 border-b border-gray-700 last:border-0">
        <div class="flex items-center justify-between gap-3">
          <div class="text-sm text-gray-200">${escapeHtml(log.word)} · ${escapeHtml(log.topic_name)}</div>
          <div class="text-xs ${log.status === 'sent' ? 'text-green-400' : 'text-red-400'}">${escapeHtml(log.status)}</div>
        </div>
        <div class="text-xs text-gray-500 mt-1">${escapeHtml(log.sent_date)} ${escapeHtml(log.sent_at || '')}</div>
        ${log.error ? `<div class="text-xs text-red-400 mt-1">${escapeHtml(log.error)}</div>` : ''}
      </div>
    `).join('');
  }

  #message(text, ok) {
    const el = document.getElementById('vocab-msg');
    el.className = `text-sm ${ok ? 'text-green-400' : 'text-red-400'}`;
    el.textContent = text;
    el.classList.remove('hidden');
  }
}
