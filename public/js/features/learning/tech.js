import {
  getLearnings,
  getLearningItems,
  importLearningExcel,
} from '../../api/learning.js';
import { encodeActionArgs } from '../../app/events.js';

export const techFeature = {
  async loadTechStacks() {
    const res = await getLearnings('tech');
    if (!res?.ok) return;

    const container = document.getElementById('tech-stack-pills');
    if (!container) return;

    container.innerHTML = res.learnings.map((s) => `
      <div data-tech-stack="${s.slug}" data-action="learning.selectTechStack" data-action-args="${encodeActionArgs(s.slug)}"
        class="cursor-pointer p-3 rounded-2xl border transition text-center shadow-md ${
          s.slug === this.activeTechSlug
            ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-500/40 text-white'
            : 'bg-gray-800/80 border-gray-700/80 hover:bg-gray-700/80 text-gray-300'
        }">
        <span class="text-2xl block mb-1">${s.icon || '💻'}</span>
        <h4 class="font-bold text-xs truncate">${s.name}</h4>
        <span class="text-[10px] text-gray-400 font-mono mt-0.5 block">${s.active_item_count || 0} câu hỏi</span>
      </div>
    `).join('');
  },

  selectTechStack(slug) {
    if (slug === this.activeTechSlug && this.techQuestions.length) return;
    this.activeTechSlug = slug;
    this.pendingTechQuestionId = null;
    this.activeTechQuestion = null;
    this.flashcardIndex = 0;
    this.flashcardFlipped = false;
    this.updateTechStackSelection();
    this.loadTechQuestions();
    this.syncUrl();
  },

  updateTechStackSelection() {
    document.querySelectorAll('[data-tech-stack]').forEach((el) => {
      const selected = el.dataset.techStack === this.activeTechSlug;
      el.classList.toggle('bg-indigo-600/30', selected);
      el.classList.toggle('border-indigo-500', selected);
      el.classList.toggle('ring-2', selected);
      el.classList.toggle('ring-indigo-500/40', selected);
      el.classList.toggle('text-white', selected);
      el.classList.toggle('bg-gray-800/80', !selected);
      el.classList.toggle('border-gray-700/80', !selected);
      el.classList.toggle('text-gray-300', !selected);
    });
  },

  async loadTechQuestions() {
    const requestId = ++this.techLoadRequestId;
    const search = document.getElementById('tech-search')?.value || '';
    const level = document.getElementById('tech-filter-level')?.value || '';
    const status = document.getElementById('tech-filter-status')?.value || '';

    const res = await getLearningItems({
      category: 'tech',
      learning: this.activeTechSlug,
      type: 'tech_question',
      search,
      level,
      status,
      bookmarked: this.techBookmarkOnly ? 1 : 0,
      limit: 200,
    });

    if (requestId !== this.techLoadRequestId || !res?.ok) return;
    this.techQuestions = res.items || [];
    this.renderTechList();

    if (this.techQuestions.length > 0) {
      const requestedQuestion = this.pendingTechQuestionId
        ? this.techQuestions.find(q => q.id === this.pendingTechQuestionId)
        : null;
      this.pendingTechQuestionId = null;

      if (requestedQuestion) {
        this.selectTechQuestion(requestedQuestion.id, { updateUrl: false });
      } else if (!this.activeTechQuestion || !this.techQuestions.some(q => q.id === this.activeTechQuestion.id)) {
        this.selectTechQuestion(this.techQuestions[0].id, { updateUrl: false });
      }
    } else {
      this.activeTechQuestion = null;
      this.renderTechDetail(null);
    }

    if (this.techViewMode === 'flashcard') this.renderFlashcard();
  },

  async importTechExcel(input) {
    const file = input.files?.[0];
    if (!file) return;

    const resStacks = await getLearnings('tech');
    const stack = resStacks?.learnings?.find((s) => s.slug === this.activeTechSlug);
    if (!stack) {
      alert('Không tìm thấy Tech Stack đang chọn');
      return;
    }

    const res = await importLearningExcel(stack.id, file);
    input.value = '';
    if (res?.ok) {
      alert(`Import thành công ${res.created} câu hỏi vào ${stack.name}!`);
      await this.loadTechQuestions();
      await this.loadTechStacks();
    } else {
      alert(res?.error || 'Import Tech thất bại');
    }
  },

  exportTechExcel() {
    window.location.href = `/api/learning/export/${encodeURIComponent(this.activeTechSlug)}`;
  },

  renderTechList() {
    const listCount = document.getElementById('tech-list-count');
    if (listCount) listCount.textContent = `${this.techQuestions.length} câu hỏi`;

    const container = document.getElementById('tech-question-list');
    if (!container) return;

    if (!this.techQuestions.length) {
      container.innerHTML = `
        <div class="p-8 text-center text-gray-500 text-xs">
          Chưa có câu hỏi nào. Bấm <b>✨ AI Tạo câu hỏi</b> để Đần AI tự động soạn bài nhé!
        </div>
      `;
      return;
    }

    container.innerHTML = this.techQuestions.map((q) => {
      const isSelected = this.activeTechQuestion?.id === q.id;
      const isBookmarked = q.is_bookmarked === 1;
      const levelColors = {
        junior: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60',
        intermediate: 'bg-blue-900/60 text-blue-300 border-blue-700/60',
        advanced: 'bg-purple-900/60 text-purple-300 border-purple-700/60',
      };
      const badgeColor = levelColors[q.level] || levelColors.junior;

      return `
        <div data-action="learning.selectTechQuestion" data-action-args="${encodeActionArgs(q.id)}"
          class="p-3.5 cursor-pointer transition flex items-start justify-between gap-3 ${
            isSelected ? 'bg-indigo-950/60 border-l-4 border-indigo-500' : 'hover:bg-gray-750'
          }">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-mono px-2 py-0.5 rounded border ${badgeColor}">${q.level || 'junior'}</span>
              ${q.status === 'mastered' ? '<span class="text-[10px] text-amber-400">⭐ Đã thuộc</span>' : ''}
            </div>
            <h4 class="font-bold text-xs text-white truncate">${q.title}</h4>
            <p class="text-[11px] text-gray-400 line-clamp-1 mt-0.5">${q.prompt || q.content?.quick_answer || ''}</p>
          </div>
          <button data-action="learning.toggleBookmark" data-action-args="${encodeActionArgs(q.id)}" data-stop-propagation="true" class="text-sm text-gray-500 hover:text-amber-400 p-1">
            ${isBookmarked ? '⭐' : '☆'}
          </button>
        </div>
      `;
    }).join('');
  },

  selectTechQuestion(id, { updateUrl = true } = {}) {
    const item = this.techQuestions.find(q => q.id === id);
    if (!item) return;
    this.activeTechQuestion = item;
    this.renderTechList();
    if (this.techViewMode === 'flashcard') this.renderFlashcard();
    else this.renderTechDetail(item);
    this.closeTechQuestionBank();
    document.getElementById('tech-detail-panel')?.scrollTo?.({ top: 0, behavior: 'smooth' });
    if (updateUrl) this.syncUrl();
  },

  openTechQuestionBank() {
    if (this.techViewMode !== 'split') this.setTechViewMode('split');
    const modal = document.getElementById('tech-question-bank-modal');
    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
  },

  closeTechQuestionBank() {
    const modal = document.getElementById('tech-question-bank-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
  },

  selectAdjacentTechQuestion(offset) {
    if (!this.activeTechQuestion || !this.techQuestions.length) return;
    const currentIndex = this.techQuestions.findIndex((question) => question.id === this.activeTechQuestion.id);
    const nextIndex = currentIndex + Number(offset || 0);
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= this.techQuestions.length) return;
    this.selectTechQuestion(this.techQuestions[nextIndex].id);
  },

  renderTechDetail(item) {
    const emptyEl = document.getElementById('tech-detail-empty');
    const contentEl = document.getElementById('tech-detail-content');
    const actionsEl = document.getElementById('tech-detail-actions');
    if (!item) {
      emptyEl?.classList.remove('hidden');
      contentEl?.classList.add('hidden');
      actionsEl?.classList.add('hidden');
      actionsEl?.classList.remove('flex');
      return;
    }

    emptyEl?.classList.add('hidden');
    contentEl?.classList.remove('hidden');

    let c = item.content || {};
    if (typeof c === 'string') {
      try { c = JSON.parse(c); } catch (_) { c = { detailed_answer: c }; }
    }

    let detailedText = c.detailed_answer || '';
    if (typeof detailedText === 'string' && (detailedText.trim().startsWith('[') || detailedText.trim().startsWith('{'))) {
      try {
        const parsed = JSON.parse(detailedText.trim());
        if (Array.isArray(parsed) && parsed.length) {
          const first = parsed[0];
          if (first.content?.detailed_answer) detailedText = first.content.detailed_answer;
          if (!c.quick_answer && first.content?.quick_answer) c.quick_answer = first.content.quick_answer;
          if (!c.code_example && first.content?.code_example) c.code_example = first.content.code_example;
        }
      } catch (_) {}
    }
    const currentIndex = this.techQuestions.findIndex((question) => question.id === item.id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex >= 0 && currentIndex < this.techQuestions.length - 1;
    if (actionsEl) {
      actionsEl.classList.remove('hidden');
      actionsEl.classList.add('flex');
      actionsEl.innerHTML = `
        <button data-action="learning.selectAdjacentTechQuestion" data-action-args="${encodeActionArgs(-1)}" ${hasPrevious ? '' : 'disabled'} title="Câu trước" aria-label="Câu trước" class="flex-1 py-2 px-2.5 sm:px-3 rounded-xl border border-gray-600 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white text-xs sm:text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition active:scale-95 shadow">
          <span aria-hidden="true" class="text-base sm:text-lg">←</span>
          <span>Câu trước</span>
        </button>
        <span class="py-2 px-2.5 sm:px-3 rounded-xl border border-gray-700 bg-gray-950/80 text-center text-xs font-mono text-gray-200 flex items-center justify-center shrink-0 min-w-[4.5rem] sm:min-w-[5rem] shadow-inner">${currentIndex + 1} / ${this.techQuestions.length}</span>
        <button data-action="learning.selectAdjacentTechQuestion" data-action-args="${encodeActionArgs(1)}" ${hasNext ? '' : 'disabled'} title="Câu sau" aria-label="Câu sau" class="flex-1 py-2 px-2.5 sm:px-3 rounded-xl border border-gray-600 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white text-xs sm:text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition active:scale-95 shadow">
          <span>Câu sau</span>
          <span aria-hidden="true" class="text-base sm:text-lg">→</span>
        </button>
        <button data-action="learning.deleteItem" data-action-args="${encodeActionArgs(item.id)}" title="Xóa câu hỏi" aria-label="Xóa câu hỏi" class="px-2.5 sm:px-3 py-2 rounded-xl border border-gray-700 bg-gray-800 hover:bg-red-900/60 active:bg-red-900 text-gray-400 hover:text-red-300 text-xs flex items-center justify-center transition active:scale-95 shrink-0 shadow">🗑️</button>
      `;
    }
    contentEl.innerHTML = `
      <div class="border-b border-gray-700/80 pb-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-xs font-mono px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-700 text-indigo-300 font-semibold">${item.level || 'junior'}</span>
            <span class="text-xs text-gray-400">${item.learning_name || 'Tech'}</span>
          </div>
          <h2 class="text-base font-black text-white leading-snug">${item.title}</h2>
        </div>
      </div>

      <div class="space-y-4 text-xs pb-6 sm:pb-0">
        ${item.prompt ? `
          <div class="bg-gray-900/80 p-3.5 rounded-xl border border-gray-700/80 text-gray-300">
            <span class="font-bold text-gray-400 block mb-1 uppercase tracking-wider text-[10px]">❓ Đề bài chi tiết</span>
            <p class="leading-relaxed">${item.prompt}</p>
          </div>
        ` : ''}

        ${c.quick_answer ? `
          <div class="bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-800/50">
            <span class="font-bold text-indigo-400 block mb-1 text-[11px] flex items-center gap-1.5">
              <span>⚡</span> Trả lời nhanh 30s phỏng vấn:
            </span>
            <p class="text-gray-200 leading-relaxed">${c.quick_answer}</p>
          </div>
        ` : ''}

        ${detailedText ? `
          <div class="bg-gray-900/80 p-3.5 rounded-xl border border-gray-700/80 space-y-1.5">
            <span class="font-bold text-gray-300 block text-[11px] uppercase tracking-wider text-[10px]">🔍 Phân tích chuyên sâu (Under the hood)</span>
            <p class="text-gray-300 leading-relaxed whitespace-pre-line">${detailedText}</p>
          </div>
        ` : ''}

        ${c.code_example ? `
          <div class="space-y-1.5 min-w-0 max-w-full">
            <span class="font-bold text-gray-400 text-[10px] uppercase tracking-wider">💻 Code minh họa thực tế</span>
            <pre class="bg-gray-950 p-3.5 sm:p-4 rounded-xl text-[11px] sm:text-xs font-mono text-emerald-400 border border-gray-800 max-w-full block whitespace-pre-wrap break-words"><code class="block font-mono whitespace-pre-wrap break-words">${c.code_example}</code></pre>
          </div>
        ` : ''}

        ${c.interview_tips || c.practical_tips ? `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${c.interview_tips ? `
              <div class="bg-amber-950/30 p-3 rounded-xl border border-amber-800/40">
                <span class="font-bold text-amber-400 text-[10px] block mb-1">⚠️ Bẫy phỏng vấn</span>
                <p class="text-amber-200/90 leading-relaxed text-[11px]">${c.interview_tips}</p>
              </div>
            ` : ''}
            ${c.practical_tips ? `
              <div class="bg-emerald-950/30 p-3 rounded-xl border border-emerald-800/40">
                <span class="font-bold text-emerald-400 text-[10px] block mb-1">💡 Kinh nghiệm thực chiến</span>
                <p class="text-emerald-200/90 leading-relaxed text-[11px]">${c.practical_tips}</p>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  },

  setTechViewMode(mode) {
    this.techViewMode = mode;
    if (mode !== 'split') this.closeTechQuestionBank();
    const splitView = document.getElementById('tech-split-view');
    const flashView = document.getElementById('tech-flashcard-view');
    const examView = document.getElementById('tech-practice-exam');
    const splitBtn = document.getElementById('tech-view-split-btn');
    const flashBtn = document.getElementById('tech-view-flash-btn');
    const examBtn = document.getElementById('tech-view-exam-btn');

    [splitBtn, flashBtn, examBtn].forEach((button) => {
      button?.classList.remove('bg-indigo-600', 'text-white');
      button?.classList.add('text-gray-400');
      button?.setAttribute('aria-pressed', 'false');
    });
    splitView?.classList.add('hidden');
    flashView?.classList.add('hidden');
    examView?.classList.add('hidden');

    if (mode === 'split') {
      splitView?.classList.remove('hidden');
      splitBtn?.classList.add('bg-indigo-600', 'text-white');
      splitBtn?.classList.remove('text-gray-400');
      splitBtn?.setAttribute('aria-pressed', 'true');
      const questionBank = document.getElementById('tech-question-bank-modal');
      questionBank?.classList.remove('hidden');
      questionBank?.classList.add('flex');
    } else if (mode === 'flashcard') {
      flashView?.classList.remove('hidden');
      flashBtn?.classList.add('bg-indigo-600', 'text-white');
      flashBtn?.classList.remove('text-gray-400');
      flashBtn?.setAttribute('aria-pressed', 'true');
      this.flashcardIndex = 0;
      this.flashcardFlipped = false;
      this.renderFlashcard();
    } else if (mode === 'exam') {
      examView?.classList.remove('hidden');
      examBtn?.classList.add('bg-indigo-600', 'text-white');
      examBtn?.classList.remove('text-gray-400');
      examBtn?.setAttribute('aria-pressed', 'true');
      this.loadPracticeExam('tech');
    }
  },

  renderFlashcard() {
    const container = document.getElementById('tech-flashcard-view');
    if (!container) return;

    if (!this.techQuestions.length) {
      container.innerHTML = '<p class="text-gray-500">Chưa có câu hỏi nào để học Flashcard</p>';
      return;
    }

    const item = this.techQuestions[this.flashcardIndex];
    const total = this.techQuestions.length;
    const c = item.content || {};

    container.innerHTML = `
      <div class="flex items-center justify-between text-xs text-gray-400">
        <span>Thẻ <b>${this.flashcardIndex + 1}</b> / ${total}</span>
        <span class="font-mono px-2 py-0.5 bg-gray-700 rounded">${item.level || 'junior'}</span>
      </div>

      <div data-action="learning.flipFlashcard" class="min-h-[220px] p-6 bg-gray-900 rounded-2xl border border-gray-700 flex flex-col items-center justify-center cursor-pointer transition hover:border-indigo-500 text-center">
        ${!this.flashcardFlipped ? `
          <span class="text-xs text-indigo-400 mb-2 font-bold uppercase tracking-wider">Mặt trước (Câu hỏi)</span>
          <h3 class="text-lg font-bold text-white mb-3">${item.title}</h3>
          <p class="text-xs text-gray-400">${item.prompt || 'Chạm để lật xem câu trả lời nhanh'}</p>
        ` : `
          <span class="text-xs text-emerald-400 mb-2 font-bold uppercase tracking-wider">Mặt sau (Trả lời nhanh)</span>
          ${c.code_example ? `<div class="min-w-0 max-w-full text-left"><pre class="bg-gray-950 p-3.5 rounded-xl text-xs font-mono text-emerald-400 max-w-full border border-gray-800 block whitespace-pre-wrap break-words"><code class="block font-mono whitespace-pre-wrap break-words">${c.code_example}</code></pre></div>` : ''}
        `}
      </div>

      <div class="flex items-center justify-between gap-4">
        <button data-action="learning.prevFlashcard" title="Câu trước (phím ←)" aria-label="Câu trước" aria-keyshortcuts="ArrowLeft" class="w-14 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl text-3xl leading-none font-bold text-white transition flex items-center justify-center"><span aria-hidden="true">←</span></button>
        <button data-action="learning.flipFlashcard" title="Lật thẻ (phím Space)" aria-label="Lật thẻ" aria-keyshortcuts="Space" class="w-14 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-2xl leading-none font-bold text-white transition flex items-center justify-center"><span aria-hidden="true">🔄</span></button>
        <button data-action="learning.nextFlashcard" title="Câu tiếp theo (phím →)" aria-label="Câu tiếp theo" aria-keyshortcuts="ArrowRight" class="w-14 h-12 bg-gray-700 hover:bg-gray-600 rounded-xl text-3xl leading-none font-bold text-white transition flex items-center justify-center"><span aria-hidden="true">→</span></button>
      </div>
    `;
  },

  flipFlashcard() {
    this.flashcardFlipped = !this.flashcardFlipped;
    this.renderFlashcard();
  },

  handleFlashcardKeyboardShortcut(event) {
    const container = document.getElementById('tech-flashcard-view');
    if (!container || container.getClientRects().length === 0 || event.repeat) return;

    const target = event.target;
    const tagName = target?.tagName?.toLowerCase();
    if (target?.isContentEditable || ['input', 'textarea', 'select', 'button'].includes(tagName)) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.prevFlashcard();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.nextFlashcard();
    } else if (event.code === 'Space' || event.key === ' ') {
      event.preventDefault();
      this.flipFlashcard();
    }
  },

  prevFlashcard() {
    if (this.flashcardIndex > 0) {
      this.flashcardIndex--;
      this.flashcardFlipped = false;
      this.renderFlashcard();
    }
  },

  nextFlashcard() {
    if (this.flashcardIndex < this.techQuestions.length - 1) {
      this.flashcardIndex++;
      this.flashcardFlipped = false;
      this.renderFlashcard();
    }
  },

  toggleTechBookmarkFilter() {
    this.techBookmarkOnly = !this.techBookmarkOnly;
    const btn = document.getElementById('tech-btn-bookmark-toggle');
    if (this.techBookmarkOnly) {
      btn?.classList.add('bg-amber-600', 'text-white');
      btn?.classList.remove('bg-gray-900', 'text-gray-300');
    } else {
      btn?.classList.remove('bg-amber-600', 'text-white');
      btn?.classList.add('bg-gray-900', 'text-gray-300');
    }
    this.loadTechQuestions();
  },
};
