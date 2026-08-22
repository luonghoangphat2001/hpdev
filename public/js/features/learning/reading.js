import {
  getLearningItems,
} from '../../api/learning.js';
import { encodeActionArgs } from '../../app/events.js';

export const readingFeature = {
  userReadingAnswers: {}, // { [questionId]: 'A' | 'TRUE' | ... }
  readingSubmitted: false,
  readingFontSize: 16, // px

  async loadReading() {
    const list = document.getElementById('reading-tasks-list');
    const workspace = document.getElementById('reading-workspace');
    if (list) {
      list.innerHTML = `<div class="p-4 text-center text-xs text-gray-400">⏳ Đang tải danh sách bài đọc...</div>`;
    }

    const res = await getLearningItems({
      category: 'english',
      type: 'reading',
      level: this.englishFilterLevel,
      limit: 100,
    });

    this.readingTasks = res?.items || [];
    this.renderReadingTasksList();

    if (this.readingTasks.length > 0) {
      const requestedTask = this.pendingEnglishItemId
        ? this.readingTasks.find(t => t.id === this.pendingEnglishItemId)
        : null;
      this.pendingEnglishItemId = null;

      if (requestedTask) {
        this.selectReadingTask(requestedTask.id, { updateUrl: false });
      } else if (!this.activeReadingTask || !this.readingTasks.some(t => t.id === this.activeReadingTask.id)) {
        this.selectReadingTask(this.readingTasks[0].id, { updateUrl: false });
      } else {
        this.renderReadingWorkspace();
      }
    } else {
      this.activeReadingTask = null;
      if (workspace) {
        workspace.innerHTML = `
          <div class="flex flex-col items-center justify-center text-center p-12 text-gray-500 space-y-4 max-w-md mx-auto">
            <span class="text-4xl">📖</span>
            <h4 class="text-base font-bold text-white">Chưa có bài đọc hiểu nào</h4>
            <p class="text-xs text-gray-400 leading-relaxed">
              Bấm nút tạo đề để AI tạo bài đọc học thuật kèm câu hỏi trắc nghiệm chuẩn IELTS!
            </p>
            <button data-action="learning.openAIGeneratorModal" data-action-args='["reading"]' class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition">
              ✨ Tạo Bài Đọc Mới
            </button>
          </div>
        `;
      }
    }
  },

  selectReadingTask(id, { updateUrl = true } = {}) {
    this.activeReadingTask = this.readingTasks.find(t => t.id === Number(id)) || null;
    this.userReadingAnswers = {};
    this.readingSubmitted = false;
    this.showReadingModelAnswer = false;
    this.renderReadingTasksList();
    this.renderReadingWorkspace();
    if (updateUrl) this.syncUrl();
  },

  renderReadingTasksList() {
    const list = document.getElementById('reading-tasks-list');
    const countEl = document.getElementById('reading-tasks-count');
    if (countEl) {
      countEl.textContent = `${this.readingTasks.length} bài đọc`;
    }
    if (!list) return;

    if (!this.readingTasks.length) {
      list.innerHTML = `<div class="p-6 text-center text-xs text-gray-500">Chưa có bài đọc nào.</div>`;
      return;
    }

    list.innerHTML = this.readingTasks.map((t) => {
      const isSelected = this.activeReadingTask?.id === t.id;
      const levelBadges = {
        beginner: 'bg-emerald-950 text-emerald-300 border-emerald-800',
        junior: 'bg-teal-950 text-teal-300 border-teal-800',
        intermediate: 'bg-indigo-950 text-indigo-300 border-indigo-800',
        advanced: 'bg-purple-950 text-purple-300 border-purple-800',
        ielts_7: 'bg-rose-950 text-rose-300 border-rose-800',
      };
      const badgeCls = levelBadges[t.level] || 'bg-gray-800 text-gray-300 border-gray-700';
      const qCount = t.content?.questions?.length || t.content?.comprehension_questions?.length || 0;

      return `
        <div data-action="learning.selectReadingTask" data-action-args="${encodeActionArgs(t.id)}"
          class="p-3 rounded-xl cursor-pointer transition text-left group ${
            isSelected
              ? 'bg-indigo-950/80 border border-indigo-500/80 text-white shadow'
              : 'hover:bg-gray-800/60 text-gray-300 border border-transparent'
          }">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeCls}">${t.level || 'IELTS'}</span>
            <div class="flex items-center gap-1.5">
              ${qCount > 0 ? `<span class="text-[10px] text-gray-400 font-mono">${qCount} câu</span>` : ''}
              <button data-action="learning.deleteItem" data-action-args="${encodeActionArgs(t.id)}" title="Xóa bài"
                class="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-0.5 text-xs">
                🗑️
              </button>
            </div>
          </div>
          <h4 class="font-bold text-xs leading-snug line-clamp-1 ${isSelected ? 'text-indigo-200' : 'text-white'}">${t.title}</h4>
          <p class="text-[11px] text-gray-400 line-clamp-1 mt-1">${(t.prompt || '').replace(/\[Paragraph [A-Z]\]/g, '')}</p>
        </div>
      `;
    }).join('');
  },

  selectReadingOption(qId, optionKey) {
    if (this.readingSubmitted) return;
    this.userReadingAnswers[qId] = optionKey;
    this.renderReadingWorkspace();
  },

  checkReadingAnswers() {
    this.readingSubmitted = true;
    this.renderReadingWorkspace();
    const resultBanner = document.getElementById('reading-score-banner');
    if (resultBanner) {
      resultBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  resetReadingQuiz() {
    this.userReadingAnswers = {};
    this.readingSubmitted = false;
    this.renderReadingWorkspace();
  },

  adjustReadingFontSize(delta) {
    this.readingFontSize = Math.min(22, Math.max(14, this.readingFontSize + delta));
    const textElements = document.querySelectorAll('.reading-passage-paragraph');
    textElements.forEach(el => {
      el.style.fontSize = `${this.readingFontSize}px`;
    });
    const indicator = document.getElementById('reading-font-size-indicator');
    if (indicator) {
      indicator.textContent = `${this.readingFontSize}px`;
    }
  },

  renderReadingWorkspace() {
    const workspace = document.getElementById('reading-workspace');
    if (!workspace) return;

    const t = this.activeReadingTask;
    if (!t) return;

    const content = t.content || {};
    const sample = t.sample_solution || {};
    const keyVocab = Array.isArray(content.key_vocabulary) ? content.key_vocabulary : [];
    const modelAnswer = sample.model_answer || sample.sample_solution || sample.detailed_answer || '';

    // Normalize questions
    let questions = [];
    if (Array.isArray(content.questions) && content.questions.length) {
      questions = content.questions;
    } else if (Array.isArray(content.comprehension_questions)) {
      questions = content.comprehension_questions.map((q, idx) => {
        if (typeof q === 'object' && q !== null) {
          return { id: idx + 1, ...q };
        }
        return {
          id: idx + 1,
          type: 'open_question',
          question: String(q),
          options: [],
        };
      });
    }

    // Word count & read time
    const rawPassage = t.prompt || '';
    const passageWords = rawPassage.trim().split(/\s+/).filter(Boolean).length;
    const estTimeMinutes = Math.max(1, Math.ceil(passageWords / 170));

    // Calculate score
    let correctCount = 0;
    let answeredCount = 0;
    let totalGradable = 0;

    questions.forEach((q) => {
      const userAns = (this.userReadingAnswers[q.id] || '').trim().toUpperCase();
      if (userAns) answeredCount++;
      if (q.correct_answer) {
        totalGradable++;
        const correctAns = String(q.correct_answer).trim().toUpperCase();
        if (userAns === correctAns || userAns === correctAns.charAt(0)) {
          correctCount++;
        }
      }
    });

    const isAllCorrect = totalGradable > 0 && correctCount === totalGradable;
    const scorePercent = totalGradable > 0 ? Math.round((correctCount / totalGradable) * 100) : 0;

    // Parse paragraphs cleanly
    const paragraphs = rawPassage.split(/\n\s*\n/).filter(p => p.trim());

    workspace.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-8 py-2">
        
        <!-- Header Section -->
        <div class="space-y-3 pb-5 border-b border-gray-750">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 text-[11px] font-mono font-semibold">
                📖 ${t.level || 'IELTS Reading'}
              </span>
              <span class="text-xs text-gray-400 font-mono">⏱️ ~${estTimeMinutes} phút đọc • ${passageWords} từ</span>
            </div>
            
            <!-- Controls -->
            <div class="flex items-center gap-2">
              <div class="flex items-center bg-gray-900 rounded-xl px-1.5 py-1 text-xs">
                <button data-action="learning.adjustReadingFontSize" data-action-args="[-1]" class="px-2 py-0.5 text-gray-400 hover:text-white rounded font-bold" title="Giảm cỡ chữ">A-</button>
                <span id="reading-font-size-indicator" class="px-1.5 text-gray-300 font-mono text-[11px]">${this.readingFontSize}px</span>
                <button data-action="learning.adjustReadingFontSize" data-action-args="[1]" class="px-2 py-0.5 text-gray-400 hover:text-white rounded font-bold" title="Tăng cỡ chữ">A+</button>
              </div>
              <button data-action="learning.openAIGeneratorModal" data-action-args='["reading"]'
                class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow transition flex items-center gap-1.5">
                <span>✨</span> Tạo Đề Mới
              </button>
            </div>
          </div>

          <h1 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">${t.title}</h1>
        </div>

        <!-- 1. Full-Width Reading Passage (Clean Medium / Article Flow) -->
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <span>📖</span> Academic Reading Passage
            </h3>
            <span class="text-[11px] text-gray-400 italic">Đọc kỹ bài đọc bên dưới trước khi trả lời câu hỏi</span>
          </div>

          <div class="space-y-5 text-gray-100 font-serif leading-loose select-text bg-gray-900/60 p-6 sm:p-8 rounded-2xl">
            ${paragraphs.length ? paragraphs.map((p) => {
              const paraMatch = p.match(/^(\[Paragraph [A-Z]\]|Paragraph [A-Z]\:?|[A-Z]\.)\s*(.*)/is);
              if (paraMatch) {
                return `
                  <div class="space-y-2">
                    <span class="inline-block px-2.5 py-0.5 rounded bg-indigo-900/80 text-indigo-200 font-mono font-bold text-xs">${paraMatch[1]}</span>
                    <p class="reading-passage-paragraph text-gray-200 leading-relaxed" style="font-size: ${this.readingFontSize}px;">${paraMatch[2]}</p>
                  </div>
                `;
              }
              return `<p class="reading-passage-paragraph text-gray-200 leading-relaxed" style="font-size: ${this.readingFontSize}px;">${p}</p>`;
            }).join('') : `<p class="reading-passage-paragraph text-gray-300" style="font-size: ${this.readingFontSize}px;">${rawPassage}</p>`}
          </div>
        </div>

        <!-- 2. Vocabulary Chips (Under passage) -->
        ${keyVocab.length ? `
          <div class="space-y-3 pt-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span>🔑</span> Key Vocabulary & Academic Collocations:
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              ${keyVocab.map(v => `
                <div class="px-3.5 py-2 rounded-xl bg-gray-900/80 text-emerald-300 text-xs font-mono flex items-start gap-2">
                  <span class="text-emerald-500 font-bold">▪</span>
                  <span>${v}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 3. Questions Section (Placed Underneath Passage) -->
        <div class="space-y-6 pt-6 border-t border-gray-750">
          
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <span>❓</span> Questions (${questions.length})
              </h2>
              <p class="text-xs text-gray-400 mt-0.5">Chọn đáp án chính xác cho từng câu hỏi bên dưới</p>
            </div>
            <span class="text-xs text-gray-400 font-mono">Đã chọn: <b class="text-indigo-400">${answeredCount}/${questions.length}</b></span>
          </div>

          <!-- Result Banner (When submitted) -->
          ${this.readingSubmitted && totalGradable > 0 ? `
            <div id="reading-score-banner" class="p-6 rounded-2xl ${isAllCorrect ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-200' : 'bg-indigo-950/80 border border-indigo-500/60 text-indigo-200'} shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div class="space-y-1 text-center sm:text-left">
                <span class="text-xs font-bold uppercase tracking-wider">${isAllCorrect ? '🎉 Perfect Score!' : '📊 Kết Quả Bài Làm'}</span>
                <h3 class="text-xl font-black text-white font-mono">${correctCount} / ${totalGradable} Đúng (${scorePercent}%)</h3>
                <p class="text-xs text-gray-300 leading-relaxed">
                  ${isAllCorrect ? 'Bạn đã làm đúng toàn bộ câu hỏi đọc hiểu!' : 'Xem lại lời giải thích và vị trí đoạn văn trích dẫn ở từng câu bên dưới nhé.'}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button data-action="learning.resetReadingQuiz" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition">
                  🔄 Làm Lại
                </button>
                ${modelAnswer ? `
                  <button data-action="learning.toggleReadingModelAnswer" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition">
                    💡 ${this.showReadingModelAnswer ? 'Ẩn Lời Giải' : 'Toàn Bộ Lời Giải'}
                  </button>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Question Cards List -->
          <div class="space-y-5">
            ${questions.length ? questions.map((q, idx) => {
              const userAns = this.userReadingAnswers[q.id];
              const hasOptions = Array.isArray(q.options) && q.options.length > 0;
              const isCorrect = this.readingSubmitted && q.correct_answer && (
                (userAns || '').trim().toUpperCase() === String(q.correct_answer).trim().toUpperCase() ||
                (userAns || '').trim().toUpperCase() === String(q.correct_answer).trim().toUpperCase().charAt(0)
              );
              const isWrong = this.readingSubmitted && q.correct_answer && userAns && !isCorrect;

              return `
                <div class="p-5 rounded-2xl bg-gray-900/80 transition space-y-4 ${
                  this.readingSubmitted
                    ? (isCorrect ? 'ring-1 ring-emerald-500/70 bg-emerald-950/20' : (isWrong ? 'ring-1 ring-rose-500/70 bg-rose-950/20' : ''))
                    : (userAns ? 'ring-1 ring-indigo-500/50' : '')
                }">
                  <!-- Question Prompt -->
                  <div class="flex items-start gap-3">
                    <span class="px-2.5 py-1 bg-indigo-900 text-indigo-200 rounded-lg font-mono font-bold text-xs shrink-0 mt-0.5">
                      Câu ${idx + 1}
                    </span>
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-semibold text-white leading-relaxed">${q.question}</h4>
                      ${q.paragraph_ref ? `<span class="text-[11px] text-indigo-400 font-mono block mt-1">📍 Vị trí: ${q.paragraph_ref}</span>` : ''}
                    </div>
                  </div>

                  <!-- Options (A, B, C, D or TRUE/FALSE/NOT GIVEN) -->
                  ${hasOptions ? `
                    <div class="grid grid-cols-1 gap-2 pt-1">
                      ${q.options.map((opt) => {
                        const letterMatch = opt.match(/^([A-D]|TRUE|FALSE|NOT GIVEN)\b/i);
                        const optKey = letterMatch ? letterMatch[1].toUpperCase() : opt;
                        const isSelected = userAns === optKey || userAns === opt;

                        let btnCls = 'bg-gray-950 text-gray-300 hover:bg-gray-800';
                        if (isSelected) {
                          btnCls = 'bg-indigo-950 text-white font-bold ring-2 ring-indigo-500';
                        }
                        if (this.readingSubmitted && q.correct_answer) {
                          const isTargetCorrect = optKey === String(q.correct_answer).toUpperCase() || optKey === String(q.correct_answer).toUpperCase().charAt(0);
                          if (isTargetCorrect) {
                            btnCls = 'bg-emerald-950 text-emerald-200 font-bold ring-2 ring-emerald-500';
                          } else if (isSelected && !isTargetCorrect) {
                            btnCls = 'bg-rose-950 text-rose-300 line-through opacity-80';
                          }
                        }

                        return `
                          <button type="button"
                            data-action="learning.selectReadingOption"
                            data-action-args='[${q.id}, ${JSON.stringify(optKey)}]'
                            class="w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm transition flex items-start gap-3 ${btnCls}">
                            <span class="font-mono font-bold text-xs opacity-75 shrink-0 mt-0.5">${optKey}:</span>
                            <span class="leading-relaxed flex-1">${opt.replace(/^([A-D]|TRUE|FALSE|NOT GIVEN)[\.\:\-\s]+/i, '')}</span>
                          </button>
                        `;
                      }).join('')}
                    </div>
                  ` : `
                    <div class="pt-1">
                      <input type="text"
                        placeholder="Nhập câu trả lời..."
                        value="${userAns || ''}"
                        data-action="learning.selectReadingOption"
                        data-action-args='[${q.id}, this.value]'
                        class="w-full px-4 py-3 bg-gray-950 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    </div>
                  `}

                  <!-- Detailed Explanation (After Submit) -->
                  ${this.readingSubmitted && (q.explanation || q.correct_answer) ? `
                    <div class="p-3.5 rounded-xl bg-gray-950 space-y-1.5 text-xs">
                      <div class="flex items-center justify-between">
                        <span class="font-bold text-emerald-400">✅ Đáp án chính xác: ${q.correct_answer}</span>
                        ${q.paragraph_ref ? `<span class="text-[11px] text-gray-400 font-mono">${q.paragraph_ref}</span>` : ''}
                      </div>
                      ${q.explanation ? `<p class="text-gray-300 text-[11px] leading-relaxed italic">${q.explanation}</p>` : ''}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('') : `
              <div class="p-6 text-center text-xs text-gray-400">
                Bài đọc chưa có danh sách câu hỏi trắc nghiệm.
              </div>
            `}
          </div>

          <!-- Bottom Submission Button -->
          <div class="pt-4 pb-8">
            ${!this.readingSubmitted ? `
              <button data-action="learning.checkReadingAnswers"
                class="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-xl transition flex items-center justify-center gap-2">
                <span>✅</span> Nộp Bài & Xem Điểm
              </button>
            ` : `
              <div class="flex items-center gap-3">
                <button data-action="learning.resetReadingQuiz"
                  class="flex-1 py-3 bg-gray-800 hover:bg-gray-750 text-white rounded-xl text-xs font-bold transition">
                  🔄 Làm Lại Bài
                </button>
                ${modelAnswer ? `
                  <button data-action="learning.toggleReadingModelAnswer"
                    class="flex-1 py-3 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 rounded-xl text-xs font-bold transition">
                    <span>💡</span> ${this.showReadingModelAnswer ? 'Ẩn Lời Giải' : 'Toàn Bộ Lời Giải'}
                  </button>
                ` : ''}
              </div>
            `}
          </div>

          <!-- Full Model Answer Card -->
          ${this.showReadingModelAnswer && modelAnswer ? `
            <div class="p-6 bg-indigo-950/50 rounded-2xl space-y-3">
              <span class="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                💡 Đáp Án Tham Khảo & Trích Dẫn Toàn Bài
              </span>
              <div class="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap font-sans bg-gray-950/70 p-4 rounded-xl">${modelAnswer}</div>
            </div>
          ` : ''}

        </div>

      </div>
    `;
  },

  toggleReadingModelAnswer() {
    this.showReadingModelAnswer = !this.showReadingModelAnswer;
    this.renderReadingWorkspace();
  },
};
