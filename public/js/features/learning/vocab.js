import {
  getLearnings,
  getLearningItems,
  fillVocabPronunciations,
  importLearningExcel,
  sendLearningDiscord,
} from '../../api/learning.js';
import { encodeActionArgs } from '../../app/events.js';

export const vocabFeature = {
  async loadVocabTopics() {
    const res = await getLearnings('english', 'vocabulary');
    if (!res?.ok) return;

    const grid = document.getElementById('vocab-topics-grid');
    const quizTopicSelect = document.getElementById('quiz-topic-select');

    if (grid) {
      grid.innerHTML = res.learnings.map((t) => {
        const topicName = t.name || `Topic ${t.topic_no}`;
        return `
        <button data-action="learning.selectVocabTopic" data-action-args="${encodeActionArgs(t.topic_no)}"
          class="px-2.5 py-2 rounded-xl text-xs font-semibold transition truncate border ${
            Number(t.topic_no) === this.activeTopicNo
              ? 'bg-indigo-600 border-indigo-500 text-white shadow'
              : 'bg-gray-900/90 border-gray-700 text-gray-300 hover:bg-gray-750'
          }">
          <span class="block truncate" title="${topicName}">${topicName}</span>
          <span class="block text-[10px] text-gray-500">Topic ${t.topic_no} · ${t.active_item_count || 0} từ</span>
        </button>
      `;
      }).join('');
    }

    if (quizTopicSelect) {
      quizTopicSelect.innerHTML = `<option value="">Tất cả 50 Topics</option>` + res.learnings.map((t) => {
        const topicName = t.name || `Topic ${t.topic_no}`;
        return `<option value="${t.topic_no}">${topicName}</option>`;
      }).join('');
    }
  },

  selectVocabTopic(topicNo) {
    this.activeTopicNo = Number(topicNo);
    const topic = document.querySelector(`#vocab-topics-grid button[onclick*="${this.activeTopicNo}"]`);
    const titleEl = document.getElementById('vocab-topic-selected-title');
    const headingEl = document.getElementById('vocab-current-topic-heading');
    const topicName = topic?.querySelector('span')?.textContent?.trim() || `Topic ${this.activeTopicNo}`;
    if (titleEl) titleEl.textContent = topicName;
    if (headingEl) headingEl.textContent = `Danh sách Từ vựng — ${topicName}`;

    this.loadVocabTopics();
    this.loadVocabWords();
    this.syncUrl();
  },

  async loadVocabWords() {
    const search = document.getElementById('vocab-search')?.value || '';
    const res = await getLearningItems({
      category: 'english',
      type: 'vocabulary',
      topic_no: this.activeTopicNo,
      level: this.englishFilterLevel,
      search,
      limit: 100,
    });

    if (!res?.ok) return;
    this.vocabWords = res.items || [];
    this.renderVocabTable();
  },

  renderVocabTable() {
    const countEl = document.getElementById('vocab-items-count');
    if (countEl) countEl.textContent = `(${this.vocabWords.length} từ)`;

    const tbody = document.getElementById('vocab-words-tbody');
    const mobileCards = document.getElementById('vocab-words-mobile-cards');
    if (!tbody && !mobileCards) return;

    if (!this.vocabWords.length) {
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="px-4 py-8 text-center text-gray-500">
              Chưa có từ vựng nào trong Topic này. Bấm <b>✨ AI Sinh Từ Vựng</b> để tạo tự động nhé!
            </td>
          </tr>
        `;
      }
      if (mobileCards) {
        mobileCards.innerHTML = `
          <div class="py-8 px-4 text-center text-gray-500 space-y-2">
            <span class="text-3xl block">📖</span>
            <p class="text-xs">Chưa có từ vựng nào trong Topic này.<br>Bấm <b>✨ AI Sinh Từ Vựng</b> để tạo tự động nhé!</p>
          </div>
        `;
      }
      return;
    }

    if (tbody) {
      tbody.innerHTML = this.vocabWords.map((w, idx) => {
        const c = w.content || {};
        const isSent = w.is_sent === 1;

        return `
          <tr class="hover:bg-gray-750/50 transition">
            <td class="px-4 py-3 font-bold text-white">
              <span class="text-gray-500 font-mono text-[10px] mr-1.5">${idx + 1}.</span>
              ${w.title}
            </td>
            <td class="px-4 py-3">
              <span class="font-mono text-indigo-400 text-[11px] block">${c.pronunciation || ''}</span>
              <span class="text-gray-200 font-medium">${c.meaning || ''}</span>
            </td>
            <td class="px-4 py-3 max-w-xs">
              <p class="text-gray-300 italic text-[11px]">${c.example || ''}</p>
              <p class="text-gray-400 text-[10px] mt-0.5">${c.note || ''}</p>
            </td>
            <td class="px-4 py-3">
              ${isSent
                ? '<span class="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px]">Đã gửi</span>'
                : '<span class="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-400 text-[10px]">Chưa gửi</span>'
              }
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <button data-action="learning.sendDiscord" data-action-args="${encodeActionArgs(w.id)}" title="Gửi Discord" class="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded text-[11px] font-semibold">
                  🚀 Gửi
                </button>
                <button data-action="learning.deleteItem" data-action-args="${encodeActionArgs(w.id)}" title="Xóa" class="text-gray-500 hover:text-red-400 text-xs p-1">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (mobileCards) {
      mobileCards.innerHTML = this.vocabWords.map((w, idx) => {
        const c = w.content || {};
        const isSent = w.is_sent === 1;

        return `
          <div class="relative bg-gradient-to-b from-gray-800/95 to-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-700/80 shadow-md text-center space-y-2.5 transition hover:border-indigo-500/50">
            <!-- Top Bar: Index & Mini Actions -->
            <div class="flex items-center justify-between text-xs">
              <span class="font-mono font-bold text-gray-500 text-[11px] px-2 py-0.5 rounded-full bg-gray-950/60 border border-gray-800">#${idx + 1}</span>
              
              <div class="flex items-center gap-1.5">
                <button data-action="learning.sendDiscord" data-action-args="${encodeActionArgs(w.id)}" title="${isSent ? 'Đã gửi (bấm gửi lại)' : 'Gửi Discord'}" class="w-7 h-7 rounded-lg text-xs font-semibold flex items-center justify-center border transition active:scale-95 ${
                  isSent
                    ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-indigo-950/70 border-indigo-800/80 text-indigo-300 hover:bg-indigo-900/60'
                }">
                  🚀
                </button>
                <button data-action="learning.deleteItem" data-action-args="${encodeActionArgs(w.id)}" title="Xóa từ" class="w-7 h-7 rounded-lg bg-gray-900/80 hover:bg-red-950/80 border border-gray-750 text-gray-400 hover:text-red-300 text-xs flex items-center justify-center transition active:scale-95">
                  🗑️
                </button>
              </div>
            </div>

            <!-- CENTER HERO: English Word + IPA + Meaning -->
            <div class="py-1 space-y-1">
              <h3 class="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight select-all">${w.title}</h3>
              ${c.pronunciation ? `
                <div class="flex justify-center">
                  <span class="text-xs font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-800/70 px-2.5 py-0.5 rounded-full font-medium">${c.pronunciation}</span>
                </div>
              ` : ''}
              <p class="text-base sm:text-lg font-bold text-emerald-400 leading-snug pt-0.5">${c.meaning || ''}</p>
            </div>

            <!-- Example & Note (Recessed background container) -->
            ${c.example || c.note ? `
              <div class="bg-gray-950/70 rounded-xl p-2.5 sm:p-3 border border-gray-800/80 space-y-1 text-center">
                ${c.example ? `<p class="italic text-xs text-gray-200 leading-relaxed">“${c.example}”</p>` : ''}
                ${c.note ? `<p class="text-[11px] text-gray-400 leading-relaxed">💡 ${c.note}</p>` : ''}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }
  },

  async fillPronunciations() {
    const res = await fillVocabPronunciations();
    if (res?.ok) {
      alert(`Đã cập nhật phiên âm IPA cho ${res.updated} từ vựng!`);
      this.loadVocabWords();
    } else {
      alert(res?.error || 'Cập nhật thất bại');
    }
  },

  async importExcel(input) {
    const file = input.files?.[0];
    if (!file) return;

    const resTopics = await getLearnings('english', 'vocabulary');
    const currentTopic = resTopics?.learnings?.find(t => Number(t.topic_no) === this.activeTopicNo);
    if (!currentTopic) {
      alert('Không tìm thấy Topic');
      return;
    }

    const res = await importLearningExcel(currentTopic.id, file);
    if (res?.ok) {
      alert(`Import thành công ${res.created} từ vào Topic ${this.activeTopicNo}!`);
      input.value = '';
      this.loadVocabWords();
    } else {
      alert(res?.error || 'Import thất bại');
    }
  },

  exportExcel() {
    window.location.href = `/api/learning/export/vocab-topic-${this.activeTopicNo}`;
  },

  exportAllExcel() {
    window.location.href = `/api/learning/export/all`;
  },

  async sendDiscord(id) {
    if (!confirm('Gửi từ vựng này ngay lập tức vào kênh Discord?')) return;
    const res = await sendLearningDiscord(id);
    if (res?.ok) {
      alert(res.message || 'Đã gửi thành công!');
      this.loadVocabWords();
    } else {
      alert(res?.error || 'Gửi thất bại');
    }
  },
};
