import {
  getLearningItems,
  evaluateLearningAI,
} from '../../api/learning.js';
import { encodeActionArgs } from '../../app/events.js';

export const writingFeature = {
  async loadWriting() {
    const list = document.getElementById('writing-tasks-list');
    const workspace = document.getElementById('writing-workspace');
    if (list) {
      list.innerHTML = `<div class="p-4 text-center text-xs text-gray-400">⏳ Đang tải danh sách bài luyện viết...</div>`;
    }

    const res = await getLearningItems({
      category: 'english',
      type: 'writing',
      level: this.englishFilterLevel,
      limit: 100,
    });

    this.writingTasks = res?.items || [];
    this.renderWritingTasksList();

    if (this.writingTasks.length > 0) {
      const requestedTask = this.pendingEnglishItemId
        ? this.writingTasks.find(t => t.id === this.pendingEnglishItemId)
        : null;
      this.pendingEnglishItemId = null;

      if (requestedTask) {
        this.selectWritingTask(requestedTask.id, { updateUrl: false });
      } else if (!this.activeWritingTask || !this.writingTasks.some(t => t.id === this.activeWritingTask.id)) {
        this.selectWritingTask(this.writingTasks[0].id, { updateUrl: false });
      } else {
        this.renderWritingWorkspace();
      }
    } else {
      this.activeWritingTask = null;
      if (workspace) {
        workspace.innerHTML = `
          <div class="flex flex-col items-center justify-center text-center p-12 text-gray-500 space-y-3">
            <span class="text-4xl">✍️</span>
            <h4 class="text-sm font-bold text-white">Chưa có đề bài viết nào trong Ngân Hàng</h4>
            <p class="text-xs text-gray-400 max-w-sm">Bấm nút <b>+ AI Tạo Đề</b> ở trên để Đần AI tự động soạn đề bài viết (email, bài luận, báo cáo) cho bạn!</p>
            <button data-action="learning.openAIGeneratorModal" data-action-args='["writing"]' class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition">
              ✨ Tạo Đề Viết Bằng AI
            </button>
          </div>
        `;
      }
    }
  },

  selectWritingTask(id, { updateUrl = true } = {}) {
    this.activeWritingTask = this.writingTasks.find(t => t.id === Number(id)) || null;
    this.showWritingModelAnswer = false;
    this.renderWritingTasksList();
    this.renderWritingWorkspace();
    if (updateUrl) this.syncUrl();
  },

  renderWritingTasksList() {
    const list = document.getElementById('writing-tasks-list');
    if (!list) return;

    if (!this.writingTasks.length) {
      list.innerHTML = `
        <div class="p-6 text-center text-xs text-gray-500">
          Chưa có bài viết nào. Bấm <b>+ AI Tạo Đề</b> để tạo bài.
        </div>
      `;
      return;
    }

    list.innerHTML = this.writingTasks.map((t) => {
      const isSelected = this.activeWritingTask?.id === t.id;
      const levelBadges = {
        beginner: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60',
        junior: 'bg-teal-900/60 text-teal-300 border-teal-700/60',
        intermediate: 'bg-indigo-900/60 text-indigo-300 border-indigo-700/60',
        advanced: 'bg-purple-900/60 text-purple-300 border-purple-700/60',
        ielts_7: 'bg-rose-900/60 text-rose-300 border-rose-700/60',
      };
      const badgeCls = levelBadges[t.level] || 'bg-gray-800 text-gray-300 border-gray-700';

      return `
        <div data-action="learning.selectWritingTask" data-action-args="${encodeActionArgs(t.id)}"
          class="p-3.5 cursor-pointer transition flex items-start justify-between gap-3 group ${
            isSelected
              ? 'bg-indigo-950/60 border-l-4 border-l-indigo-500 text-white'
              : 'hover:bg-gray-750/70 text-gray-300'
          }">
          <div class="space-y-1.5 flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeCls}">${t.level || 'B2'}</span>
              <h4 class="font-bold text-xs truncate ${isSelected ? 'text-indigo-200' : 'text-white'}">${t.title}</h4>
            </div>
            <p class="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">${t.prompt || ''}</p>
          </div>
          <button data-action="learning.deleteItem" data-action-args="${encodeActionArgs(t.id)}" title="Xóa bài"
            class="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1 text-xs">
            🗑️
          </button>
        </div>
      `;
    }).join('');
  },

  renderWritingWorkspace() {
    const workspace = document.getElementById('writing-workspace');
    if (!workspace) return;

    const t = this.activeWritingTask;
    if (!t) return;

    const content = t.content || {};
    const sample = t.sample_solution || {};
    const instructions = content.instructions || content.description || '';
    const keyVocab = Array.isArray(content.key_vocabulary) ? content.key_vocabulary : [];
    const modelAnswer = sample.model_answer || sample.sample_solution || sample.detailed_answer || '';

    workspace.innerHTML = `
      <div class="space-y-5">
        <!-- Header -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-700">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/60 font-semibold text-[10px]">
                ✍️ ${t.level || 'Intermediate (B2)'}
              </span>
              <span class="text-xs text-gray-400 font-mono">#${t.id}</span>
            </div>
            <h2 class="text-lg font-bold text-white leading-tight">${t.title}</h2>
          </div>
          <button data-action="learning.openAIGeneratorModal" data-action-args='["writing"]'
            class="px-3 py-1.5 bg-gray-750 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold border border-gray-700 flex items-center gap-1.5 transition">
            <span>✨</span> Tạo thêm đề viết
          </button>
        </div>

        <!-- Writing Task Prompt Box -->
        <div class="bg-gray-900/90 rounded-2xl p-5 border border-gray-700 space-y-4 shadow-inner">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <span>📝</span> Yêu Cầu Đề Bài (Writing Task)
              </span>
            </div>
            <div class="text-gray-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans bg-gray-950/60 p-4 rounded-xl border border-gray-800/80">
              ${t.prompt || 'Chưa có nội dung đề bài.'}
            </div>
          </div>

          ${instructions ? `
            <div class="p-3 bg-purple-950/30 rounded-xl border border-purple-800/40">
              <span class="text-[11px] font-bold text-purple-300 block mb-1">📋 Hướng dẫn làm bài:</span>
              <p class="text-xs text-gray-300 leading-relaxed">${instructions}</p>
            </div>
          ` : ''}

          ${keyVocab.length ? `
            <div>
              <span class="text-[11px] font-bold text-emerald-400 block mb-1.5">🔑 Cụm từ gợi ý nên dùng (Target Vocabulary):</span>
              <div class="flex flex-wrap gap-1.5">
                ${keyVocab.map(v => `<span class="px-2 py-0.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-[11px] rounded-lg">${v}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Writing Editor Area -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-bold text-white flex items-center gap-1.5">
              <span>✍️</span> Bài viết của bạn:
            </label>
            <span id="writing-word-count" class="text-xs font-mono text-gray-400">0 từ | 0 ký tự</span>
          </div>
          <textarea id="writing-user-submission" rows="8"
            placeholder="Bắt đầu viết bài luận, đoạn văn hoặc email của bạn tại đây..."
            class="w-full px-4 py-3 bg-gray-900 rounded-xl border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-xs sm:text-sm leading-relaxed resize-none shadow-inner font-sans"></textarea>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <button id="writing-btn-submit-eval" data-action="learning.submitWritingEvaluation"
              class="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/30 transition flex items-center gap-2">
              <span>🤖</span> Đần AI Chấm & Sửa Lỗi Ngữ Pháp
            </button>
            ${modelAnswer ? `
              <button data-action="learning.toggleWritingModelAnswer"
                class="px-4 py-2.5 bg-gray-750 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-semibold border border-gray-700 transition flex items-center gap-1.5">
                <span>💡</span> ${this.showWritingModelAnswer ? 'Ẩn Bài Mẫu' : 'Xem Bài Mẫu'}
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Model Essay Card -->
        ${this.showWritingModelAnswer && modelAnswer ? `
          <div class="p-4 bg-purple-950/40 rounded-xl border border-purple-700/60 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>💡</span> Bài Viết Mẫu Hoàn Chỉnh (Model Essay)
              </span>
            </div>
            <div class="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap font-serif">${modelAnswer}</div>
          </div>
        ` : ''}

        <!-- AI Feedback Section -->
        <div id="writing-ai-feedback-container" class="hidden"></div>
      </div>
    `;

    // Word counter
    const txt = document.getElementById('writing-user-submission');
    const counter = document.getElementById('writing-word-count');
    if (txt && counter) {
      txt.addEventListener('input', () => {
        const val = txt.value.trim();
        const words = val ? val.split(/\s+/).length : 0;
        counter.textContent = `${words} từ | ${val.length} ký tự`;
      });
    }
  },

  toggleWritingModelAnswer() {
    this.showWritingModelAnswer = !this.showWritingModelAnswer;
    this.renderWritingWorkspace();
  },

  async submitWritingEvaluation() {
    const t = this.activeWritingTask;
    if (!t) return;

    const txt = document.getElementById('writing-user-submission');
    const submission = txt ? txt.value.trim() : '';

    if (!submission) {
      alert('Vui lòng nhập bài viết trước khi yêu cầu AI chấm điểm!');
      return;
    }

    const btn = document.getElementById('writing-btn-submit-eval');
    const feedbackBox = document.getElementById('writing-ai-feedback-container');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="animate-spin">⏳</span> Đang chấm bài viết & phân tích ngữ pháp...`;
    }

    try {
      const res = await evaluateLearningAI({
        itemId: t.id,
        type: 'writing',
        submission,
      });

      if (res?.ok && res.feedback && feedbackBox) {
        feedbackBox.classList.remove('hidden');
        const fb = res.feedback;
        const score = fb.overall_band || fb.score || 8.0;
        const scoreColor = score >= 7.5 ? 'text-emerald-400' : (score >= 6.0 ? 'text-amber-400' : 'text-rose-400');

        feedbackBox.innerHTML = `
          <div class="p-5 bg-gray-900 rounded-2xl border border-purple-500/40 space-y-4 shadow-xl">
            <div class="flex items-center justify-between border-b border-gray-800 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-xl">✍️</span>
                <div>
                  <h4 class="text-xs font-bold text-white uppercase tracking-wider">Đánh Giá Kỹ Năng Viết</h4>
                  <p class="text-[11px] text-gray-400">Giám khảo Khảo thí AI</p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-2xl font-black ${scoreColor}">${score}</span>
                <span class="text-xs text-gray-400">/9.0</span>
              </div>
            </div>

            ${fb.examiner_comment || fb.summary ? `
              <p class="text-xs text-gray-200 leading-relaxed bg-gray-950/60 p-3 rounded-xl border border-gray-800">
                ${fb.examiner_comment || fb.summary}
              </p>
            ` : ''}

            ${fb.criteria_scores ? `
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div class="p-2.5 bg-gray-950 rounded-xl border border-gray-800">
                  <span class="text-[10px] text-gray-400 block">Task Response</span>
                  <span class="text-sm font-bold text-white">${fb.criteria_scores.task_achievement || fb.criteria_scores.task_response || '-'}</span>
                </div>
                <div class="p-2.5 bg-gray-950 rounded-xl border border-gray-800">
                  <span class="text-[10px] text-gray-400 block">Coherence</span>
                  <span class="text-sm font-bold text-white">${fb.criteria_scores.coherence_cohesion || '-'}</span>
                </div>
                <div class="p-2.5 bg-gray-950 rounded-xl border border-gray-800">
                  <span class="text-[10px] text-gray-400 block">Lexical Resource</span>
                  <span class="text-sm font-bold text-white">${fb.criteria_scores.lexical_resource || '-'}</span>
                </div>
                <div class="p-2.5 bg-gray-950 rounded-xl border border-gray-800">
                  <span class="text-[10px] text-gray-400 block">Grammar Range</span>
                  <span class="text-sm font-bold text-white">${fb.criteria_scores.grammatical_range_accuracy || '-'}</span>
                </div>
              </div>
            ` : ''}

            ${Array.isArray(fb.detailed_corrections) && fb.detailed_corrections.length ? `
              <div class="space-y-2 pt-2 border-t border-gray-800">
                <span class="text-xs font-bold text-purple-300 block">🔍 Sửa lỗi ngữ pháp & nâng cấp từ vựng:</span>
                <div class="space-y-2 max-h-48 overflow-y-auto">
                  ${fb.detailed_corrections.map(c => `
                    <div class="p-2.5 bg-gray-950 rounded-lg border border-gray-800 text-xs space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="text-rose-400 line-through">${c.original || ''}</span>
                        <span class="text-gray-500">➜</span>
                        <span class="text-emerald-400 font-semibold">${c.correction || ''}</span>
                      </div>
                      ${c.reason ? `<p class="text-[11px] text-gray-400 italic">${c.reason}</p>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        `;
        feedbackBox.scrollIntoView({ behavior: 'smooth' });
      } else {
        alert('Không thể nhận phản hồi từ AI, vui lòng thử lại sau!');
      }
    } catch (err) {
      alert(`Lỗi chấm điểm: ${err.message}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>🤖</span> Đần AI Chấm & Sửa Lỗi Ngữ Pháp`;
      }
    }
  },
};
