import { escapeHtml } from '../utils.js';
import { encodeActionArgs } from '../app/events.js';
import { requestPageNavigation } from '../app/navigation.js';

/**
 * Controller for the Tech Learning & Interview Bank page.
 */
export class TechPage {
  #api;
  #role = 'user';
  #stacks = [];
  #currentStack = 'php';
  #questions = [];
  #totalQuestions = 0;
  #selectedQuestionId = null;
  #currentDetailTab = 'quick';
  #viewMode = 'split'; // 'split' | 'flashcard'
  #flashcardIndex = 0;
  #flashcardRevealed = false;
  #filters = {
    search: '',
    level: 'all',
    status: 'all',
    bookmarked: false,
    limit: 50,
    offset: 0,
  };
  #searchTimer = null;

  /**
   * @param {typeof import('../api/tech.js')} api
   * @param {string} role
   */
  constructor(api, role = 'user') {
    this.#api = api;
    this.#role = role;
  }

  setRole(role) {
    this.#role = role;
    this.#updateAdminControls();
  }

  #updateAdminControls() {
    const isAdmin = this.#role === 'admin';
    const btnAdd = document.getElementById('tech-btn-add');
    const btnImport = document.getElementById('tech-btn-import');

    if (btnAdd) {
      btnAdd.style.display = isAdmin ? 'inline-flex' : 'none';
    }

    if (btnImport) {
      btnImport.style.display = isAdmin ? 'inline-flex' : 'none';
    }
  }

  copyCodeSnippet() {
    return navigator.clipboard.writeText(
      document.getElementById('tech-code-snippet')?.textContent || '',
    );
  }

  async load() {
    this.#updateAdminControls();
    await this.#loadStacks();
    await this.#loadQuestions();
  }

  async #loadStacks() {
    try {
      const res = await this.#api.getTechStacks();
      if (res.ok && res.stacks) {
        this.#stacks = res.stacks;
        this.#renderStacks();
      }
    } catch (err) {
      console.error('[TechPage] loadStacks error:', err);
    }
  }

  #renderStacks() {
    const container = document.getElementById('tech-stacks-container');

    if (!container) {
      return;
    }

    container.innerHTML = this.#stacks.map((s) => {
      const isActive = s.slug === this.#currentStack;
      const mastered = Number(s.mastered_count || 0);
      const total = Number(s.total_questions || 0);
      const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;

      const activeBorder = isActive
        ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/50 shadow-indigo-500/10 shadow-lg'
        : 'border-gray-700/80 bg-gray-800/90 hover:border-gray-600 hover:bg-gray-800';

      return `
        <button data-action="tech.selectStack" data-action-args="${encodeActionArgs(s.slug)}"
          class="text-left p-3 rounded-2xl border transition-all relative overflow-hidden group ${activeBorder}">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-2xl group-hover:scale-110 transition-transform">${s.icon || '💻'}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300'}">
              ${total} câu
            </span>
          </div>
          <div class="font-bold text-sm text-white truncate">${escapeHtml(s.name)}</div>
          <div class="flex items-center justify-between text-[11px] text-gray-400 mt-1">
            <span>Tiến độ:</span>
            <span class="font-semibold text-emerald-400">${percent}%</span>
          </div>
          <div class="w-full bg-gray-700/60 rounded-full h-1 mt-1.5 overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
          </div>
        </button>
      `;
    }).join('');
  }

  async selectStack(slug) {
    if (this.#currentStack === slug) {
      return;
    }

    this.#currentStack = slug;
    this.#filters.offset = 0;
    this.#selectedQuestionId = null;
    this.#flashcardIndex = 0;
    this.#flashcardRevealed = false;
    this.#renderStacks();
    await this.#loadQuestions();
  }

  onSearchInput(val) {
    clearTimeout(this.#searchTimer);
    this.#searchTimer = setTimeout(() => {
      this.#filters.search = val.trim();
      this.#filters.offset = 0;
      this.#loadQuestions();
    }, 300);
  }

  onFilterChange() {
    const level = document.getElementById('tech-level-filter')?.value || 'all';
    const status = document.getElementById('tech-status-filter')?.value || 'all';
    const bookmarked = document.getElementById('tech-bookmark-filter')?.checked || false;

    this.#filters.level = level;
    this.#filters.status = status;
    this.#filters.bookmarked = bookmarked;
    this.#filters.offset = 0;
    this.#loadQuestions();
  }

  setViewMode(mode) {
    this.#viewMode = mode;
    const btnSplit = document.getElementById('tech-view-split');
    const btnFlashcard = document.getElementById('tech-view-flashcard');

    if (mode === 'split') {
      btnSplit.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-indigo-600 text-white';
      btnFlashcard.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition';
    } else {
      btnFlashcard.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition bg-indigo-600 text-white';
      btnSplit.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition';
      this.#flashcardRevealed = false;
    }
    this.#renderWorkspace();
  }

  async #loadQuestions() {
    try {
      const params = {
        stack: this.#currentStack,
        level: this.#filters.level,
        status: this.#filters.status,
        bookmarked: this.#filters.bookmarked ? '1' : '0',
        search: this.#filters.search,
        limit: this.#filters.limit,
        offset: this.#filters.offset,
      };

      const res = await this.#api.getTechQuestions(params);
      if (res.ok) {
        this.#questions = res.questions || [];
        this.#totalQuestions = res.total || 0;

        if (!this.#selectedQuestionId && this.#questions.length > 0) {
          this.#selectedQuestionId = this.#questions[0].id;
        } else if (this.#questions.length > 0 && !this.#questions.some(q => q.id === this.#selectedQuestionId)) {
          this.#selectedQuestionId = this.#questions[0].id;
        }

        this.#renderWorkspace();
      }
    } catch (err) {
      console.error('[TechPage] loadQuestions error:', err);
    }
  }

  #renderWorkspace() {
    const container = document.getElementById('tech-workspace-container');

    if (!container) {
      return;
    }

    if (!this.#questions.length) {
      container.innerHTML = `
        <div class="bg-gray-800 rounded-2xl p-12 text-center border border-gray-700/80 space-y-4">
          <div class="text-4xl">📂</div>
          <h3 class="text-lg font-bold text-gray-200">Chưa có câu hỏi nào phù hợp với bộ lọc</h3>
          <p class="text-xs text-gray-400 max-w-md mx-auto">
            Hãy thử đổi bộ lọc hoặc bấm vào nút <strong>"✨ AI Tạo Câu Hỏi"</strong> để Đần AI tự động soạn bộ câu hỏi chất lượng cao cho bạn!
          </p>
          <button data-action="tech.openAiGeneratorModal"
            class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition shadow-lg inline-flex items-center gap-2">
            <span>✨</span> Tạo ngay bằng AI
          </button>
        </div>
      `;
      return;
    }

    if (this.#viewMode === 'flashcard') {
      this.#renderFlashcardView(container);
    } else {
      this.#renderSplitView(container);
    }
  }

  #renderSplitView(container) {
    const selectedQ = this.#questions.find(q => q.id === this.#selectedQuestionId) || this.#questions[0];

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Question List (5 cols) -->
        <div class="lg:col-span-5 bg-gray-800/90 rounded-2xl border border-gray-700/80 overflow-hidden flex flex-col h-[740px]">
          <div class="px-4 py-3 border-b border-gray-700/80 flex items-center justify-between bg-gray-800/50">
            <span class="text-xs font-bold text-gray-300">Danh sách câu hỏi (${this.#totalQuestions})</span>
            <span class="text-[11px] text-gray-400">Đang chọn: #${selectedQ?.id || '-'}</span>
          </div>

          <div class="flex-1 overflow-y-auto divide-y divide-gray-700/60 p-2 space-y-1">
            ${this.#questions.map((q, idx) => {
              const isSelected = q.id === selectedQ?.id;
              const levelBadge = this.#getLevelBadge(q.level);
              const statusBadge = this.#getStatusBadge(q.user_status);

              return `
                <div data-action="tech.selectQuestion" data-action-args="${encodeActionArgs(q.id)}"
                  class="p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-indigo-900/40 border border-indigo-500/60 ring-1 ring-indigo-500/40' : 'hover:bg-gray-700/40 border border-transparent'}">
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <span class="text-[10px] font-mono text-gray-400 font-bold">#${idx + 1}</span>
                    <div class="flex items-center gap-1.5 flex-wrap justify-end">
                      ${levelBadge}
                      ${statusBadge}
                      ${q.is_bookmarked ? '<span class="text-amber-400 text-xs">⭐</span>' : ''}
                    </div>
                  </div>
                  <h4 class="font-bold text-xs text-gray-100 line-clamp-2 leading-relaxed">${escapeHtml(q.title)}</h4>
                  <p class="text-[11px] text-gray-400 line-clamp-1 mt-1 font-normal">${escapeHtml(q.quick_answer || '')}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Detail Card (7 cols) -->
        <div class="lg:col-span-7 bg-gray-800/90 rounded-2xl border border-gray-700/80 p-6 flex flex-col h-[740px] overflow-hidden shadow-xl">
          ${this.#renderDetailCard(selectedQ)}
        </div>
      </div>
    `;
  }

  #renderDetailCard(q) {
    if (!q) {
      return '<div class="text-gray-400 text-sm p-6">Vui lòng chọn câu hỏi</div>';
    }

    const isAdmin = this.#role === 'admin';
    const levelBadge = this.#getLevelBadge(q.level);
    const status = q.user_status || 'unlearned';

    return `
      <!-- Header -->
      <div class="border-b border-gray-700/80 pb-4 shrink-0 space-y-2">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            ${levelBadge}
            ${q.topic_name ? `<span class="px-2 py-0.5 bg-gray-700 text-gray-300 rounded-md text-[10px] font-semibold">${escapeHtml(q.topic_name)}</span>` : ''}
            <span class="text-xs text-gray-500 font-mono">ID: #${q.id}</span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Bookmark Button -->
            <button data-action="tech.toggleBookmark" data-action-args="${encodeActionArgs(q.id, q.is_bookmarked ? 0 : 1)}"
              class="px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${q.is_bookmarked ? 'border-amber-500/60 bg-amber-950/40 text-amber-300' : 'border-gray-700 bg-gray-700 text-gray-300 hover:text-white'}">
              ${q.is_bookmarked ? '⭐ Đã lưu' : '☆ Bookmark'}
            </button>

            <!-- Mock Interview Button -->
            <button data-action="tech.openMockModal" data-action-args="${encodeActionArgs(q.id)}"
              class="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition shadow-md flex items-center gap-1">
              <span>🎯</span> AI Phỏng Vấn
            </button>

            ${isAdmin ? `
              <button data-action="tech.openEditModal" data-action-args="${encodeActionArgs(q.id)}" class="text-xs text-gray-400 hover:text-indigo-300 p-1" title="Sửa">✏️</button>
              <button data-action="tech.deleteQuestion" data-action-args="${encodeActionArgs(q.id)}" class="text-xs text-gray-400 hover:text-red-400 p-1" title="Xóa">🗑️</button>
            ` : ''}
          </div>
        </div>

        <h3 class="text-base font-bold text-white leading-snug">${escapeHtml(q.title)}</h3>
        <p class="text-xs text-gray-300 bg-gray-900/60 p-2.5 rounded-xl border border-gray-700/60 leading-relaxed font-mono">
          ${escapeHtml(q.question)}
        </p>
      </div>

      <!-- Tab Switcher -->
      <div class="flex items-center gap-1.5 py-3 border-b border-gray-700/80 shrink-0 overflow-x-auto">
        ${this.#renderTabBtn('quick', '⚡ Trả lời nhanh 30s', this.#currentDetailTab === 'quick')}
        ${this.#renderTabBtn('deep', '🔬 Phân tích chuyên sâu', this.#currentDetailTab === 'deep')}
        ${this.#renderTabBtn('code', '💻 Code thực tế', this.#currentDetailTab === 'code')}
        ${this.#renderTabBtn('traps', '⚠️ Bẫy phỏng vấn', this.#currentDetailTab === 'traps')}
        ${this.#renderTabBtn('practical', '🛠️ Lưu ý thực chiến', this.#currentDetailTab === 'practical')}
      </div>

      <!-- Tab Content (Scrollable) -->
      <div class="flex-1 overflow-y-auto py-4 text-xs leading-relaxed text-gray-200">
        ${this.#renderTabContent(q)}
      </div>

      <!-- Footer: Study Status & Assistant Link -->
      <div class="border-t border-gray-700/80 pt-3 shrink-0 flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-1.5">
          <span class="text-[11px] text-gray-400 mr-1">Trạng thái:</span>
          ${this.#renderStatusBtn(q.id, 'unlearned', '⚪ Chưa học', status === 'unlearned')}
          ${this.#renderStatusBtn(q.id, 'learning', '🟡 Đang luyện', status === 'learning')}
          ${this.#renderStatusBtn(q.id, 'review_needed', '🟠 Cần ôn lại', status === 'review_needed')}
          ${this.#renderStatusBtn(q.id, 'mastered', '🟢 Thành thạo', status === 'mastered')}
        </div>

        <button data-action="tech.askDanAssistant" data-action-args="${encodeActionArgs(q.id)}"
          class="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-300 rounded-xl text-xs font-semibold transition flex items-center gap-1.5">
          <span>🤖</span> Hỏi Đần phân tích sâu hơn
        </button>
      </div>
    `;
  }

  #renderTabBtn(tabKey, label, isActive) {
    const cls = isActive
      ? 'bg-indigo-600 text-white font-bold'
      : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700 hover:text-white font-medium';
    return `
      <button data-action="tech.setDetailTab" data-action-args="${encodeActionArgs(tabKey)}"
        class="px-3 py-1.5 rounded-lg text-xs transition whitespace-nowrap ${cls}">
        ${label}
      </button>
    `;
  }

  setDetailTab(tab) {
    this.#currentDetailTab = tab;
    this.#renderWorkspace();
  }

  #renderTabContent(q) {
    switch (this.#currentDetailTab) {
      case 'quick':
        return `
          <div class="space-y-3">
            <div class="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-4 text-indigo-200">
              <h5 class="font-bold text-indigo-300 text-xs mb-1.5 flex items-center gap-1.5">
                <span>⚡</span> Khung trả lời 30s phỏng vấn (Elevator Pitch):
              </h5>
              <div class="whitespace-pre-wrap leading-relaxed text-sm">${escapeHtml(q.quick_answer || 'Chưa có tóm tắt.')}</div>
            </div>
            ${q.tags ? `
              <div class="flex items-center gap-1.5 flex-wrap pt-2">
                <span class="text-gray-400 text-[11px]">Tags:</span>
                ${q.tags.split(',').map(t => `<span class="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-[10px]">${escapeHtml(t.trim())}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        `;
      case 'deep':
        return `
          <div class="space-y-3 bg-gray-900/60 p-4 rounded-xl border border-gray-700/60">
            <h5 class="font-bold text-gray-200 text-xs mb-2 flex items-center gap-1.5">
              <span>🔬</span> Cơ chế hoạt động chi tiết bên dưới (Under the hood):
            </h5>
            <div class="whitespace-pre-wrap leading-relaxed text-gray-300 text-xs font-sans">${escapeHtml(q.detailed_answer || 'Chưa có phân tích sâu.')}</div>
          </div>
        `;
      case 'code':
        return `
          <div class="space-y-2">
            <div class="flex items-center justify-between text-gray-400 text-[11px]">
              <span>💻 Minh họa cú pháp & Clean Code Pattern:</span>
              <button data-action="tech.copyCodeSnippet" class="hover:text-white">📋 Copy</button>
            </div>
            <pre class="bg-gray-950 p-4 rounded-xl border border-gray-700 text-emerald-300 overflow-x-auto text-xs font-mono leading-relaxed"><code id="tech-code-snippet">${escapeHtml(q.code_example || '// Chưa có code minh họa')}</code></pre>
          </div>
        `;
      case 'traps':
        return `
          <div class="bg-rose-950/20 border border-rose-800/40 rounded-xl p-4 text-rose-200 space-y-2">
            <h5 class="font-bold text-rose-300 text-xs flex items-center gap-1.5">
              <span>⚠️</span> Những bẫy Interviewer hay hỏi vặn & Cách xử lý:
            </h5>
            <div class="whitespace-pre-wrap leading-relaxed text-xs">${escapeHtml(q.interview_tips || 'Chưa có lưu ý bẫy phỏng vấn.')}</div>
          </div>
        `;
      case 'practical':
        return `
          <div class="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 text-amber-200 space-y-2">
            <h5 class="font-bold text-amber-300 text-xs flex items-center gap-1.5">
              <span>🛠️</span> Kinh nghiệm thực chiến khi làm việc trong dự án:
            </h5>
            <div class="whitespace-pre-wrap leading-relaxed text-xs">${escapeHtml(q.practical_tips || 'Chưa có lưu ý thực chiến.')}</div>
          </div>
        `;
      default:
        return '';
    }
  }

  #renderStatusBtn(questionId, targetStatus, label, isCurrent) {
    const activeCls = isCurrent
      ? 'bg-indigo-600 text-white font-bold border-indigo-500'
      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600';
    return `
      <button data-action="tech.updateStatus" data-action-args="${encodeActionArgs(questionId, targetStatus)}"
        class="px-2 py-1 rounded-lg text-[10px] border transition ${activeCls}">
        ${label}
      </button>
    `;
  }

  #renderFlashcardView(container) {
    if (this.#flashcardIndex >= this.#questions.length) {
      this.#flashcardIndex = 0;
    }

    const q = this.#questions[this.#flashcardIndex];
    const levelBadge = this.#getLevelBadge(q.level);

    container.innerHTML = `
      <div class="max-w-3xl mx-auto space-y-6">
        <!-- Flashcard Nav Header -->
        <div class="flex items-center justify-between text-xs text-gray-400">
          <button data-action="tech.prevFlashcard" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 text-white font-semibold">
            ← Câu trước
          </button>
          <span>Câu hỏi <strong>${this.#flashcardIndex + 1}</strong> / ${this.#questions.length}</span>
          <button data-action="tech.nextFlashcard" class="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 text-white font-semibold">
            Câu sau →
          </button>
        </div>

        <!-- Flashcard Body -->
        <div class="bg-gray-800 rounded-3xl border border-gray-700/80 p-8 shadow-2xl space-y-6 min-h-[420px] flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                ${levelBadge}
                ${q.topic_name ? `<span class="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-[10px] font-semibold">${escapeHtml(q.topic_name)}</span>` : ''}
              </div>
              <button data-action="tech.toggleBookmark" data-action-args="${encodeActionArgs(q.id, q.is_bookmarked ? 0 : 1)}" class="text-sm">
                ${q.is_bookmarked ? '⭐' : '☆'}
              </button>
            </div>

            <h2 class="text-xl font-bold text-white">${escapeHtml(q.title)}</h2>
            <div class="p-4 bg-gray-900 rounded-2xl border border-gray-700 text-gray-300 text-sm font-mono leading-relaxed">
              ${escapeHtml(q.question)}
            </div>
          </div>

          ${!this.#flashcardRevealed ? `
            <div class="text-center py-8">
              <button data-action="tech.revealFlashcard"
                class="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-indigo-600/30 transition transform hover:scale-105">
                👁️ Lật Mở Đáp Án Phỏng Vấn
              </button>
              <p class="text-xs text-gray-500 mt-2">Tự nhẩm câu trả lời của bạn trong 30s trước khi lật mở</p>
            </div>
          ` : `
            <div class="space-y-4 border-t border-gray-700 pt-4 animate-fade-in">
              <div class="bg-indigo-950/40 border border-indigo-800/60 rounded-2xl p-4 text-indigo-200">
                <div class="font-bold text-indigo-300 text-xs mb-1">⚡ Đáp án chuẩn tóm tắt:</div>
                <p class="text-xs leading-relaxed whitespace-pre-wrap">${escapeHtml(q.quick_answer)}</p>
              </div>

              ${q.interview_tips ? `
                <div class="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-3 text-rose-200 text-xs">
                  <span class="font-bold text-rose-300">⚠️ Bẫy phỏng vấn:</span> ${escapeHtml(q.interview_tips)}
                </div>
              ` : ''}

              <!-- Self assessment rating -->
              <div class="pt-2 flex items-center justify-between flex-wrap gap-2">
                <span class="text-xs text-gray-400">Đánh giá độ thành thạo:</span>
                <div class="flex items-center gap-2">
                  <button data-action="tech.rateAndNext" data-action-args="${encodeActionArgs(q.id, 'review_needed')}" class="px-3 py-1.5 bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition">
                    🔴 Khó, cần ôn lại
                  </button>
                  <button data-action="tech.rateAndNext" data-action-args="${encodeActionArgs(q.id, 'learning')}" class="px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600 text-amber-300 hover:text-white rounded-xl text-xs font-bold transition">
                    🟡 Tạm ổn
                  </button>
                  <button data-action="tech.rateAndNext" data-action-args="${encodeActionArgs(q.id, 'mastered')}" class="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-bold transition">
                    🟢 Đã nắm vững (+Next)
                  </button>
                </div>
              </div>
            </div>
          `}
        </div>
      </div>
    `;
  }

  revealFlashcard() {
    this.#flashcardRevealed = true;
    this.#renderWorkspace();
  }

  nextFlashcard() {
    if (this.#flashcardIndex < this.#questions.length - 1) {
      this.#flashcardIndex++;
    } else {
      this.#flashcardIndex = 0;
    }
    this.#flashcardRevealed = false;
    this.#renderWorkspace();
  }

  prevFlashcard() {
    if (this.#flashcardIndex > 0) {
      this.#flashcardIndex--;
    } else {
      this.#flashcardIndex = this.#questions.length - 1;
    }
    this.#flashcardRevealed = false;
    this.#renderWorkspace();
  }

  async rateAndNext(questionId, status) {
    await this.updateStatus(questionId, status, false);
    this.nextFlashcard();
  }

  selectQuestion(id) {
    this.#selectedQuestionId = id;
    this.#renderWorkspace();
  }

  async updateStatus(questionId, status, refreshUI = true) {
    try {
      await this.#api.saveTechProgress(questionId, { status });
      const q = this.#questions.find(x => x.id === questionId);

      if (q) {
        q.user_status = status;
      }

      await this.#loadStacks();

      if (refreshUI) {
        this.#renderWorkspace();
      }
    } catch (err) {
      console.error('[TechPage] updateStatus error:', err);
    }
  }

  async toggleBookmark(questionId, isBookmarked) {
    try {
      await this.#api.saveTechProgress(questionId, { is_bookmarked: isBookmarked });
      const q = this.#questions.find(x => x.id === questionId);

      if (q) {
        q.is_bookmarked = isBookmarked ? 1 : 0;
      }

      await this.#loadStacks();
      this.#renderWorkspace();
    } catch (err) {
      console.error('[TechPage] toggleBookmark error:', err);
    }
  }

  askDanAssistant(questionId) {
    const q = this.#questions.find(x => x.id === questionId);

    if (!q) {
      return;
    }

    const promptText = `Tôi muốn tìm hiểu sâu hơn về câu hỏi kỹ thuật ${q.stack_name.toUpperCase()}:\n"${q.title}"\n\nNội dung câu hỏi: ${q.question}\n\nHãy giải thích cặn kẽ cho tôi về bản chất, cơ chế hoạt động, ví dụ thực tế và các câu hỏi phỏng vấn nâng cao liên quan.`;

    requestPageNavigation('chat');
    const chatInput = document.getElementById('chat-input');

    if (chatInput) {
      chatInput.value = promptText;
      chatInput.style.height = 'auto';
      chatInput.focus();
    }
  }

  // ─── AI QUESTION GENERATOR MODAL ─────────────────────────
  openAiGeneratorModal() {
    const modal = document.getElementById('tech-ai-modal');

    if (!modal) {
      return;
    }

    document.getElementById('tech-ai-stack').value = this.#currentStack;
    document.getElementById('tech-ai-result-box').classList.add('hidden');
    document.getElementById('tech-ai-result-box').innerHTML = '';
    modal.classList.remove('hidden');
  }

  closeAiModal() {
    document.getElementById('tech-ai-modal')?.classList.add('hidden');
  }

  async generateWithAI() {
    const btn = document.getElementById('tech-ai-submit-btn');
    const resultBox = document.getElementById('tech-ai-result-box');
    const stackSlug = document.getElementById('tech-ai-stack').value;
    const level = document.getElementById('tech-ai-level').value;
    const topicName = document.getElementById('tech-ai-topic').value.trim();
    const customPrompt = document.getElementById('tech-ai-custom-prompt').value.trim();
    const batchCount = Number(document.getElementById('tech-ai-batch-count').value || 1);

    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin">⏳</span> Đang tạo bằng AI...';
    resultBox.classList.remove('hidden');
    resultBox.innerHTML = '<div class="p-4 text-center text-xs text-gray-400">🤖 Đần AI đang phân tích và soạn câu hỏi chuyên sâu...</div>';

    try {
      if (batchCount > 1) {
        const res = await this.#api.batchGenerateTechAI({
          stackSlug,
          level,
          topicName,
          count: batchCount,
        });

        if (!res.ok || !res.questions?.length) {
          throw new Error(res.error || 'Không sinh được câu hỏi');
        }

        resultBox.innerHTML = `
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-emerald-400">✓ Đã sinh ${res.questions.length} câu hỏi mới!</span>
              <button data-action="tech.saveBatchToBank" data-action-args="${encodeActionArgs(res.questions)}"
                class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs">
                💾 Lưu tất cả vào Ngân hàng
              </button>
            </div>
            <div class="space-y-2 max-h-60 overflow-y-auto">
              ${res.questions.map((q, i) => `
                <div class="p-3 bg-gray-900 rounded-xl border border-gray-700 text-xs">
                  <div class="font-bold text-white">${i + 1}. ${escapeHtml(q.title)}</div>
                  <div class="text-gray-400 mt-1 text-[11px] line-clamp-2">${escapeHtml(q.quickAnswer || q.quick_answer)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        const res = await this.#api.generateTechQuestionAI({
          stackSlug,
          level,
          topicName,
          customPrompt,
        });

        if (!res.ok || !res.question) {
          throw new Error(res.error || 'Không sinh được câu hỏi');
        }

        const q = res.question;

        resultBox.innerHTML = `
          <div class="p-4 bg-gray-900 rounded-xl border border-indigo-500/50 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-white text-xs">${escapeHtml(q.title)}</span>
              <span class="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold">${escapeHtml(q.level)}</span>
            </div>
            <p class="text-xs text-gray-300">${escapeHtml(q.quickAnswer)}</p>
            <div class="flex justify-end gap-2 pt-2 border-t border-gray-700">
              <button data-action="tech.openEditModalWithData" data-action-args="${encodeActionArgs(q)}"
                class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-semibold">
                ✏️ Chỉnh sửa trước khi lưu
              </button>
              <button data-action="tech.saveSingleToBank" data-action-args="${encodeActionArgs(q)}"
                class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs shadow-md">
                💾 Lưu vào Ngân hàng
              </button>
            </div>
          </div>
        `;
      }
    } catch (err) {
      resultBox.innerHTML = `<div class="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-xl text-xs">Lỗi: ${escapeHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>✨</span> Bắt đầu tạo';
    }
  }

  async saveSingleToBank(q) {
    try {
      const res = await this.#api.createTechQuestion(q);
      if (res.ok) {
        this.closeAiModal();
        await this.load();
      }
    } catch (err) {
      alert(`Lỗi lưu câu hỏi: ${err.message}`);
    }
  }

  async saveBatchToBank(questions) {
    try {
      for (const q of questions) {
        await this.#api.createTechQuestion(q);
      }
      this.closeAiModal();
      await this.load();
    } catch (err) {
      alert(`Lỗi lưu hàng loạt: ${err.message}`);
    }
  }

  // ─── AI MOCK INTERVIEW MODAL ─────────────────────────────
  openMockModal(questionId) {
    const q = this.#questions.find(x => x.id === questionId);

    if (!q) {
      return;
    }

    this.#selectedQuestionId = questionId;
    const modal = document.getElementById('tech-mock-modal');
    const questionBox = document.getElementById('tech-mock-question-box');
    const answerInput = document.getElementById('tech-mock-answer');
    const feedbackBox = document.getElementById('tech-mock-feedback-box');

    questionBox.innerHTML = `
      <div class="font-bold text-white mb-1">${escapeHtml(q.title)}</div>
      <div class="text-xs text-gray-300 font-mono">${escapeHtml(q.question)}</div>
    `;
    answerInput.value = '';
    feedbackBox.classList.add('hidden');
    feedbackBox.innerHTML = '';
    modal.classList.remove('hidden');
  }

  closeMockModal() {
    document.getElementById('tech-mock-modal')?.classList.add('hidden');
  }

  async submitMockInterview() {
    const btn = document.getElementById('tech-mock-submit-btn');
    const answer = document.getElementById('tech-mock-answer').value.trim();
    const feedbackBox = document.getElementById('tech-mock-feedback-box');

    if (!answer) {
      alert('Vui lòng nhập câu trả lời của bạn trước khi chấm điểm.');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin">⏳</span> Đang chấm điểm...';
    feedbackBox.classList.remove('hidden');
    feedbackBox.innerHTML = '<div class="p-4 text-center text-xs text-gray-400">🤖 Đần AI đang phân tích câu trả lời của bạn...</div>';

    try {
      const res = await this.#api.mockInterviewAI({
        questionId: this.#selectedQuestionId,
        userAnswer: answer,
      });

      if (!res.ok || !res.evaluation) {
        throw new Error(res.error || 'Lỗi chấm điểm');
      }

      const evalData = res.evaluation;

      feedbackBox.innerHTML = `
        <div class="p-4 bg-gray-900 rounded-2xl border border-indigo-500/60 space-y-3">
          <div class="flex items-center justify-between border-b border-gray-700/60 pb-2">
            <span class="text-xs font-bold text-white">Kết quả đánh giá từ Đần AI</span>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold ${evalData.score >= 8 ? 'bg-emerald-600 text-white' : (evalData.score >= 5 ? 'bg-amber-600 text-white' : 'bg-rose-600 text-white')}">
                ${evalData.score}/10 Điểm (${evalData.rating || 'Đạt'})
              </span>
            </div>
          </div>

          <div class="space-y-2 text-xs">
            <div><span class="font-bold text-emerald-400">💪 Điểm mạnh:</span> <span class="text-gray-300">${escapeHtml(evalData.strengths || '')}</span></div>
            <div><span class="font-bold text-amber-400">🔍 Cần cải thiện:</span> <span class="text-gray-300">${escapeHtml(evalData.improvements || '')}</span></div>
            <div class="p-3 bg-indigo-950/40 rounded-xl border border-indigo-800/40">
              <span class="font-bold text-indigo-300">⚡ Gợi ý trả lời 1 phút tối ưu:</span>
              <p class="mt-1 text-gray-200">${escapeHtml(evalData.ideal_pitch || '')}</p>
            </div>
            ${evalData.follow_up_question ? `
              <div class="p-3 bg-gray-800 rounded-xl border border-gray-700">
                <span class="font-bold text-cyan-300">🎯 Câu hỏi follow-up vặn vẹo tiếp theo:</span>
                <p class="mt-1 text-gray-300">${escapeHtml(evalData.follow_up_question)}</p>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    } catch (err) {
      feedbackBox.innerHTML = `<div class="p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-xl text-xs">Lỗi: ${escapeHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>🎯</span> Chấm điểm câu trả lời';
    }
  }

  // ─── CRUD QUESTION MODAL ─────────────────────────────────
  openCreateModal() {
    document.getElementById('tech-crud-title').textContent = 'Thêm câu hỏi mới';
    document.getElementById('tech-crud-id').value = '';
    document.getElementById('tech-crud-form').reset();
    const stack = this.#stacks.find(s => s.slug === this.#currentStack);

    if (stack) {
      document.getElementById('tech-crud-stack').value = stack.id;
    }

    document.getElementById('tech-crud-modal')?.classList.remove('hidden');
  }

  openEditModal(questionId) {
    const q = this.#questions.find(x => x.id === questionId);

    if (!q) {
      return;
    }

    this.openEditModalWithData(q);
  }

  openEditModalWithData(q) {
    this.closeAiModal();
    document.getElementById('tech-crud-title').textContent = q.id ? `Sửa câu hỏi #${q.id}` : 'Thêm câu hỏi mới';
    document.getElementById('tech-crud-id').value = q.id || '';
    document.getElementById('tech-crud-stack').value = q.stack_id || q.stackId || '1';
    document.getElementById('tech-crud-level').value = q.level || 'junior';
    document.getElementById('tech-crud-topic').value = q.topic_name || q.topicName || '';
    document.getElementById('tech-crud-q-title').value = q.title || '';
    document.getElementById('tech-crud-question').value = q.question || '';
    document.getElementById('tech-crud-quick-answer').value = q.quick_answer || q.quickAnswer || '';
    document.getElementById('tech-crud-detailed-answer').value = q.detailed_answer || q.detailedAnswer || '';
    document.getElementById('tech-crud-code').value = q.code_example || q.codeExample || '';
    document.getElementById('tech-crud-interview-tips').value = q.interview_tips || q.interviewTips || '';
    document.getElementById('tech-crud-practical-tips').value = q.practical_tips || q.practicalTips || '';
    document.getElementById('tech-crud-tags').value = q.tags || '';
    document.getElementById('tech-crud-modal')?.classList.remove('hidden');
  }

  closeCrudModal() {
    document.getElementById('tech-crud-modal')?.classList.add('hidden');
  }

  async saveCrudQuestion(e) {
    e.preventDefault();
    const id = document.getElementById('tech-crud-id').value;
    const payload = {
      stackId: document.getElementById('tech-crud-stack').value,
      level: document.getElementById('tech-crud-level').value,
      topicName: document.getElementById('tech-crud-topic').value.trim(),
      title: document.getElementById('tech-crud-q-title').value.trim(),
      question: document.getElementById('tech-crud-question').value.trim(),
      quickAnswer: document.getElementById('tech-crud-quick-answer').value.trim(),
      detailedAnswer: document.getElementById('tech-crud-detailed-answer').value.trim(),
      codeExample: document.getElementById('tech-crud-code').value.trim(),
      interviewTips: document.getElementById('tech-crud-interview-tips').value.trim(),
      practicalTips: document.getElementById('tech-crud-practical-tips').value.trim(),
      tags: document.getElementById('tech-crud-tags').value.trim(),
    };

    try {
      if (id) {
        await this.#api.updateTechQuestion(id, payload);
      } else {
        await this.#api.createTechQuestion(payload);
      }
      this.closeCrudModal();
      await this.load();
    } catch (err) {
      alert(`Lỗi lưu câu hỏi: ${err.message}`);
    }
  }

  async deleteQuestion(id) {
    if (!confirm(`Bạn có chắc chắn muốn xóa câu hỏi #${id}?`)) {
      return;
    }

    try {
      await this.#api.deleteTechQuestion(id);
      await this.load();
    } catch (err) {
      alert(`Lỗi xóa: ${err.message}`);
    }
  }

  // ─── IMPORT / EXPORT EXCEL ────────────────────────────────
  openImportModal() {
    document.getElementById('tech-import-default-stack').value = this.#currentStack;
    document.getElementById('tech-import-msg').classList.add('hidden');
    document.getElementById('tech-import-modal')?.classList.remove('hidden');
  }

  closeImportModal() {
    document.getElementById('tech-import-modal')?.classList.add('hidden');
  }

  async submitImportExcel() {
    const fileInput = document.getElementById('tech-import-file');
    const msg = document.getElementById('tech-import-msg');
    const defaultStack = document.getElementById('tech-import-default-stack').value;

    if (!fileInput.files || !fileInput.files[0]) {
      alert('Vui lòng chọn file Excel.');
      return;
    }

    msg.classList.remove('hidden');
    msg.className = 'text-xs text-gray-400 mt-2';
    msg.textContent = 'Đang import...';

    try {
      const res = await this.#api.importTechQuestions(fileInput.files[0], defaultStack);
      if (res.ok) {
        msg.className = 'text-xs text-emerald-400 mt-2 font-bold';
        msg.textContent = `✓ Import thành công ${res.created} câu mới, cập nhật ${res.updated} câu!`;
        setTimeout(() => {
          this.closeImportModal();
          this.load();
        }, 1200);
      } else {
        throw new Error(res.error || 'Import thất bại');
      }
    } catch (err) {
      msg.className = 'text-xs text-red-400 mt-2 font-bold';
      msg.textContent = `Lỗi: ${err.message}`;
    }
  }

  exportExcel() {
    this.#api.exportTechQuestions(this.#currentStack);
  }

  // ─── BADGE HELPERS ────────────────────────────────────────
  #getLevelBadge(level) {
    switch (level) {
      case 'senior':
        return '<span class="px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-800/60 rounded text-[10px] font-bold">👑 Senior</span>';
      case 'mid':
        return '<span class="px-2 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-800/60 rounded text-[10px] font-bold">🚀 Mid</span>';
      case 'fresher':
        return '<span class="px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 rounded text-[10px] font-bold">🌱 Fresher</span>';
      case 'junior':
      default:
        return '<span class="px-2 py-0.5 bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 rounded text-[10px] font-bold">⚡ Junior</span>';
    }
  }

  #getStatusBadge(status) {
    switch (status) {
      case 'mastered':
        return '<span class="px-1.5 py-0.5 bg-emerald-600/30 text-emerald-300 rounded text-[10px] font-semibold">🟢 Đã nắm</span>';
      case 'learning':
        return '<span class="px-1.5 py-0.5 bg-amber-600/30 text-amber-300 rounded text-[10px] font-semibold">🟡 Đang luyện</span>';
      case 'review_needed':
        return '<span class="px-1.5 py-0.5 bg-rose-600/30 text-rose-300 rounded text-[10px] font-semibold">🟠 Cần ôn</span>';
      case 'unlearned':
      default:
        return '<span class="px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded text-[10px]">⚪ Chưa học</span>';
    }
  }
}
