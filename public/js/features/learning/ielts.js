import {
  getLearningItems,
  evaluateLearningAI,
} from '../../api/learning.js';
import { encodeActionArgs } from '../../app/events.js';

export const ieltsFeature = {
  async loadIelts() {
    const ws = document.getElementById('ielts-workspace');
    if (!ws) return;

    ws.innerHTML = `<div class="p-8 text-center text-xs text-gray-400">⏳ Đang tải đề thi IELTS...</div>`;

    const res = await getLearningItems({
      category: 'english',
      type: 'ielts',
      level: this.englishFilterLevel,
      limit: 100,
    });

    this.ieltsTasks = res?.items || [];

    if (!this.ieltsTasks.length) {
      ws.innerHTML = `
        <div class="p-8 bg-gray-900 rounded-2xl border border-gray-700 text-center space-y-4 max-w-2xl mx-auto">
          <span class="text-4xl">🎯</span>
          <h3 class="text-base font-bold text-white">IELTS Academic & General Prep (0.0 - 9.0)</h3>
          <p class="text-xs text-gray-400 leading-relaxed">
            Chưa có đề thi IELTS nào trong Ngân Hàng. Hãy bấm nút dưới đây để Đần AI tạo đề thi chuẩn Cambridge ngay!
          </p>
          <button data-action="learning.openAIGeneratorModal" data-action-args='["ielts"]' class="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-xs font-bold text-white shadow">
            ✨ Tạo Đề Thi IELTS Chuẩn Bằng AI
          </button>
        </div>
      `;
      return;
    }

    const requestedTask = this.pendingEnglishItemId
      ? this.ieltsTasks.find(t => t.id === this.pendingEnglishItemId)
      : null;
    this.pendingEnglishItemId = null;

    if (requestedTask) {
      this.selectIeltsTask(requestedTask.id, { updateUrl: false });
    } else if (!this.activeIeltsTask || !this.ieltsTasks.some(t => t.id === this.activeIeltsTask.id)) {
      this.selectIeltsTask(this.ieltsTasks[0].id, { updateUrl: false });
    } else {
      this.renderIeltsWorkspace();
    }
  },

  selectIeltsTask(id, { updateUrl = true } = {}) {
    this.activeIeltsTask = this.ieltsTasks.find(t => t.id === Number(id)) || null;
    this.showIeltsSample = false;
    this.resetIeltsTimer();
    this.renderIeltsWorkspace();
    if (updateUrl) this.syncUrl();
  },

  renderIeltsWorkspace() {
    const ws = document.getElementById('ielts-workspace');
    if (!ws) return;

    const task = this.activeIeltsTask;
    if (!task) return;

    const content = task.content || {};
    const sample = task.sample_solution || {};
    const taskType = content.task_type || 'Writing Task 2';
    const targetBand = content.target_band || '7.5 - 8.5';
    const band9Sample = sample.band_9_sample || sample.model_answer || sample.sample_solution || '';

    const minutes = Math.floor(this.ieltsTimeRemaining / 60);
    const seconds = this.ieltsTimeRemaining % 60;
    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    ws.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-full min-h-0">
        <!-- Left: IELTS Tasks List -->
        <div class="lg:col-span-4 bg-gray-800/90 rounded-2xl p-4 border border-gray-700/80 shadow-lg flex flex-col h-auto lg:h-full max-h-[40vh] lg:max-h-none min-h-0 overflow-hidden gap-3">
          <div class="flex items-center justify-between pb-2 border-b border-gray-700 shrink-0">
            <h4 class="font-bold text-white text-xs">Đề thi IELTS (${this.ieltsTasks.length})</h4>
            <button data-action="learning.openAIGeneratorModal" data-action-args='["ielts"]'
              class="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold transition">
              + Tạo đề
            </button>
          </div>
          <div class="space-y-2 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1">
            ${this.ieltsTasks.map((t) => {
              const isSelected = t.id === task.id;
              return `
                <div data-action="learning.selectIeltsTask" data-action-args="${encodeActionArgs(t.id)}"
                  class="p-3 rounded-xl cursor-pointer border transition text-left space-y-1.5 group ${
                    isSelected
                      ? 'bg-rose-950/70 border-rose-500 shadow-md text-white'
                      : 'bg-gray-900/60 border-gray-700/60 text-gray-300 hover:bg-gray-750'
                  }">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300">${t.content?.task_type || 'IELTS Task'}</span>
                    <button data-action="learning.deleteItem" data-action-args="${encodeActionArgs(t.id)}" title="Xóa"
                      class="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-[11px] p-0.5">🗑️</button>
                  </div>
                  <h4 class="font-bold text-xs truncate ${isSelected ? 'text-rose-200' : 'text-white'}">${t.title}</h4>
                  <p class="text-[11px] text-gray-400 line-clamp-1">${t.prompt || ''}</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right: Exam Simulator -->
        <div class="lg:col-span-8 bg-gray-800/90 rounded-2xl p-6 border border-gray-700/80 shadow-lg space-y-5 h-auto lg:h-full min-h-0 overflow-visible lg:overflow-y-auto overscroll-contain">
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-700">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="px-2.5 py-0.5 rounded-full bg-rose-900/60 text-rose-300 border border-rose-700/60 font-semibold text-[10px]">
                  🎯 ${taskType}
                </span>
                <span class="px-2 py-0.5 rounded bg-gray-700 text-gray-300 font-mono text-[10px]">Target Band: ${targetBand}</span>
              </div>
              <h2 class="text-lg font-bold text-white">${task.title}</h2>
            </div>

            <!-- Timer -->
            <div class="flex items-center gap-2 bg-gray-900 px-3.5 py-2 rounded-xl border border-gray-700">
              <span class="text-xs text-gray-400 font-medium">⏱️</span>
              <span id="ielts-timer-display" class="text-sm font-mono font-bold ${this.ieltsTimeRemaining < 300 ? 'text-red-400 animate-pulse' : 'text-indigo-300'}">${timeFormatted}</span>
              <button data-action="learning.toggleIeltsTimer" class="px-2 py-0.5 bg-gray-750 hover:bg-gray-700 text-gray-300 rounded text-[11px]">
                ${this.ieltsTimerRunning ? '⏸️' : '▶'}
              </button>
            </div>
          </div>

          <!-- Official Prompt Card -->
          <div class="bg-gray-900/90 rounded-2xl p-5 border border-gray-700 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <span>📋</span> Official Cambridge IELTS Exam Prompt
              </span>
              <span class="text-[11px] text-gray-400 font-mono">Time Allowed: 40 mins</span>
            </div>
            <div class="text-gray-200 text-xs sm:text-sm font-serif leading-relaxed whitespace-pre-wrap bg-gray-950/70 p-4 rounded-xl border border-gray-800 shadow-inner">
              ${task.prompt || 'Chưa có nội dung đề bài.'}
            </div>

            ${content.key_vocabulary?.length ? `
              <div class="p-3 bg-emerald-950/30 rounded-xl border border-emerald-900/50 space-y-1.5">
                <span class="text-[11px] font-bold text-emerald-400 block">🔑 Topic Vocabulary & C1/C2 Collocations:</span>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  ${content.key_vocabulary.map(v => `
                    <div class="px-2.5 py-1 bg-gray-950/80 rounded border border-emerald-900/60 text-emerald-300 text-xs font-mono">
                      ${v}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${content.suggested_outline ? `
              <div class="p-3 bg-indigo-950/30 rounded-xl border border-indigo-900/50">
                <span class="text-[11px] font-bold text-indigo-300 block mb-1">📐 Suggested 4-Paragraph Structure:</span>
                <div class="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">${content.suggested_outline}</div>
              </div>
            ` : ''}
          </div>

          <!-- Essay Writing Editor -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-white flex items-center gap-1.5">
                <span>✍️</span> Candidate's Response:
              </label>
              <span id="ielts-word-count" class="text-xs font-mono text-gray-400">0 / 250 words</span>
            </div>
            <textarea id="ielts-user-submission" rows="9"
              placeholder="Write your essay here (minimum 250 words for Task 2, 150 words for Task 1)..."
              class="w-full px-4 py-3 bg-gray-900 rounded-xl border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-rose-500 text-xs sm:text-sm leading-relaxed resize-none shadow-inner font-serif"></textarea>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <button id="ielts-btn-eval" data-action="learning.submitIeltsEvaluation"
                class="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-900/30 transition flex items-center gap-2">
                <span>🎯</span> Giám Khảo AI Chấm Điểm (0.0 - 9.0)
              </button>
              ${band9Sample ? `
                <button data-action="learning.toggleIeltsSample"
                  class="px-4 py-2.5 bg-gray-750 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold border border-gray-700 transition flex items-center gap-1.5">
                  <span>🏆</span> ${this.showIeltsSample ? 'Ẩn Bài Mẫu' : 'Xem Bài Mẫu Band 9.0'}
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Band 9.0 Sample Card -->
          ${this.showIeltsSample && band9Sample ? `
            <div class="p-5 bg-rose-950/30 rounded-2xl border border-rose-700/60 space-y-2">
              <span class="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>🏆</span> Examiner's Band 9.0 Model Essay
              </span>
              <div class="text-xs text-gray-200 font-serif leading-relaxed whitespace-pre-wrap bg-gray-950/70 p-4 rounded-xl border border-rose-900/40">
                ${band9Sample}
              </div>
            </div>
          ` : ''}

          <!-- AI Evaluation Container -->
          <div id="ielts-feedback-area" class="hidden"></div>
        </div>
      </div>
    `;

    const textarea = document.getElementById('ielts-user-submission');
    const wordCountEl = document.getElementById('ielts-word-count');
    if (textarea && wordCountEl) {
      textarea.addEventListener('input', () => {
        const text = textarea.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        const targetWords = taskType.includes('Task 1') ? 150 : 250;
        wordCountEl.textContent = `${words} / ${targetWords} từ`;
        wordCountEl.className = words >= targetWords ? 'text-xs font-mono text-emerald-400 font-bold' : 'text-xs font-mono text-gray-400';
      });
    }
  },

  toggleIeltsSample() {
    this.showIeltsSample = !this.showIeltsSample;
    this.renderIeltsWorkspace();
  },

  toggleIeltsTimer() {
    if (this.ieltsTimerRunning) {
      clearInterval(this.ieltsTimerInterval);
      this.ieltsTimerRunning = false;
    } else {
      this.ieltsTimerRunning = true;
      this.ieltsTimerInterval = setInterval(() => {
        if (this.ieltsTimeRemaining > 0) {
          this.ieltsTimeRemaining--;
          const el = document.getElementById('ielts-timer-display');
          if (el) {
            const min = Math.floor(this.ieltsTimeRemaining / 60);
            const sec = this.ieltsTimeRemaining % 60;
            el.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
          }
        } else {
          clearInterval(this.ieltsTimerInterval);
          this.ieltsTimerRunning = false;
          alert('Hết thời gian làm bài IELTS!');
        }
      }, 1000);
    }
    this.renderIeltsWorkspace();
  },

  resetIeltsTimer() {
    clearInterval(this.ieltsTimerInterval);
    this.ieltsTimerRunning = false;
    this.ieltsTimeRemaining = 2400;
  },

  async submitIeltsEvaluation() {
    if (!this.activeIeltsTask) return;
    const textarea = document.getElementById('ielts-user-submission');
    const userSubmission = textarea?.value?.trim();
    if (!userSubmission) {
      alert('Vui lòng viết bài trước khi gửi giám khảo AI chấm!');
      return;
    }

    const btn = document.getElementById('ielts-btn-eval');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Giám khảo AI đang chấm điểm 4 tiêu chí...';
    }

    try {
      const res = await evaluateLearningAI({
        item_id: this.activeIeltsTask.id,
        type: 'ielts',
        user_submission: userSubmission,
      });

      if (!res?.ok || !res.feedback) {
        alert(res?.error || 'Lỗi khi chấm điểm IELTS');
        return;
      }

      this.renderIeltsFeedback(res.feedback);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🎯</span> Giám Khảo AI Chấm Điểm (0.0 - 9.0)';
      }
    }
  },

  renderIeltsFeedback(fb) {
    const area = document.getElementById('ielts-feedback-area');
    if (!area) return;
    area.classList.remove('hidden');

    const overallBand = fb.overall_band || fb.score || 0;
    const criteria = fb.criteria_scores || {};

    area.innerHTML = `
      <div class="p-6 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 border border-rose-700/60 space-y-5 shadow-2xl">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700 pb-4">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>🎓</span> Bảng Điểm Chính Thức IELTS Examiner
            </h3>
            <p class="text-xs text-gray-400">Đánh giá theo chuẩn IELTS Band Descriptors quốc tế</p>
          </div>
          <div class="px-5 py-2.5 bg-rose-950/80 rounded-2xl border border-rose-500/60 text-center">
            <span class="text-[10px] uppercase font-bold text-rose-300 block">Overall Band Score</span>
            <span class="text-3xl font-black text-rose-400 font-mono leading-none">${overallBand}</span>
          </div>
        </div>

        <!-- 4 Criteria Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 bg-gray-900/90 rounded-xl border border-gray-700 text-center">
            <span class="text-[10px] text-gray-400 block mb-1">Task Response</span>
            <span class="text-lg font-bold text-white font-mono">${criteria.task_achievement || criteria.task_response || '-'}</span>
          </div>
          <div class="p-3 bg-gray-900/90 rounded-xl border border-gray-700 text-center">
            <span class="text-[10px] text-gray-400 block mb-1">Coherence & Cohesion</span>
            <span class="text-lg font-bold text-white font-mono">${criteria.coherence_cohesion || '-'}</span>
          </div>
          <div class="p-3 bg-gray-900/90 rounded-xl border border-gray-700 text-center">
            <span class="text-[10px] text-gray-400 block mb-1">Lexical Resource</span>
            <span class="text-lg font-bold text-white font-mono">${criteria.lexical_resource || '-'}</span>
          </div>
          <div class="p-3 bg-gray-900/90 rounded-xl border border-gray-700 text-center">
            <span class="text-[10px] text-gray-400 block mb-1">Grammar Accuracy</span>
            <span class="text-lg font-bold text-white font-mono">${criteria.grammatical_range_accuracy || '-'}</span>
          </div>
        </div>

        <!-- Examiner Commentary -->
        <div class="space-y-1.5">
          <span class="text-xs font-bold text-rose-300 uppercase tracking-wider block">📝 Nhận xét của Giám Khảo:</span>
          <p class="text-xs text-gray-200 leading-relaxed bg-gray-900/80 p-4 rounded-xl border border-gray-800">
            ${fb.examiner_comment || fb.summary || ''}
          </p>
        </div>

        <!-- Error Corrections -->
        ${fb.detailed_corrections?.length ? `
          <div class="space-y-2">
            <span class="text-xs font-bold text-indigo-300 uppercase tracking-wider block">🔍 Lỗi cần sửa & Cách nâng Band:</span>
            <div class="space-y-2">
              ${fb.detailed_corrections.map(c => `
                <div class="p-3 bg-gray-900 rounded-xl border border-gray-700 text-xs space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-red-400 line-through">${c.original || ''}</span>
                    <span class="text-gray-400">➔</span>
                    <span class="text-emerald-400 font-bold">${c.correction || ''}</span>
                  </div>
                  ${c.reason ? `<p class="text-gray-400 text-[11px]">${c.reason}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },
};
