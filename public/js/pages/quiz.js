import { escapeHtml } from '../utils.js';
import { encodeActionArgs } from '../app/events.js';

export class QuizPage {
  #api;
  #currentMode = 'multiple_choice';
  #questions = [];
  #currentIndex = 0;
  #score = 0;
  #streak = 0;
  #isAnswered = false;

  constructor(api) {
    this.#api = api;
  }

  submitSpelling() {
    const value = document.getElementById('spelling-input')?.value;
    if (value) return this.submitAnswer(value);
  }

  flipFlashcard() {
    document.getElementById('flashcard-front')?.classList.toggle('hidden');
    document.getElementById('flashcard-back')?.classList.toggle('hidden');
  }

  async load() {
    await this.startQuiz(this.#currentMode);
    await this.loadLeaderboard();
  }

  async startQuiz(mode = 'multiple_choice', topicNo = null) {
    this.#currentMode = mode;
    this.#questions = [];
    this.#currentIndex = 0;
    this.#score = 0;
    this.#isAnswered = false;

    this.#renderModeButtons();
    this.#showMessage('Đang khởi tạo bộ câu hỏi Quiz...', 'info');

    try {
      const res = await this.#api.generateQuizQuestions(mode, topicNo);
      if (!res.ok || !res.questions?.length) {
        this.#showMessage(res.error || 'Chưa có đủ từ vựng để tạo bài Quiz.', 'error');
        document.getElementById('quiz-card-container').innerHTML = `
          <div class="p-8 text-center text-gray-400">
            <p>Chưa có câu hỏi cho chủ đề này.</p>
          </div>`;
        return;
      }

      this.#questions = res.questions;
      this.#showMessage('', 'none');
      this.#renderQuestion();
    } catch (err) {
      this.#showMessage(`Lỗi tạo Quiz: ${err.message}`, 'error');
    }
  }

  async submitAnswer(answer) {
    if (this.#isAnswered) return;
    this.#isAnswered = true;

    const q = this.#questions[this.#currentIndex];
    try {
      const res = await this.#api.submitQuizAnswer({
        word_id: q.id,
        quiz_type: q.type,
        answer,
      });

      if (res.isCorrect) {
        this.#score += res.scoreDelta;
        this.#streak += 1;
        this.#playFeedback(true, `Chính xác! (+${res.scoreDelta} điểm)`);
      } else {
        this.#streak = 0;
        this.#playFeedback(false, `Chưa đúng! Đáp án đúng: ${escapeHtml(res.expected)}`);
      }

      this.#renderAnswerFeedback(res);
    } catch (err) {
      this.#showMessage(`Lỗi gửi đáp án: ${err.message}`, 'error');
    }
  }

  nextQuestion() {
    if (this.#currentIndex < this.#questions.length - 1) {
      this.#currentIndex += 1;
      this.#isAnswered = false;
      this.#renderQuestion();
    } else {
      this.#renderSummary();
    }
  }

  async loadLeaderboard() {
    try {
      const res = await this.#api.getQuizLeaderboard();
      const el = document.getElementById('quiz-leaderboard-list');
      if (!el) return;
      if (!res.rankings?.length) {
        el.innerHTML = '<div class="p-4 text-xs text-gray-500 text-center">Chưa có ai trong bảng xếp hạng.</div>';
        return;
      }

      el.innerHTML = res.rankings.map((user, i) => {
        const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `#${i + 1}`));
        return `
          <div class="flex items-center justify-between px-3 py-2 border-b border-gray-700/60 last:border-0 text-xs">
            <div class="flex items-center gap-2">
              <span class="w-6 text-center font-bold text-amber-400">${medal}</span>
              <span class="font-semibold text-gray-200">${escapeHtml(user.username)}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-indigo-400 font-bold">${user.total_score} điểm</span>
              <span class="text-gray-500 text-[10px]">🔥 ${user.streak_days} ngày</span>
            </div>
          </div>`;
      }).join('');
    } catch (_) { }
  }

  // ── Render Helpers ────────────────────────────────────────

  #renderModeButtons() {
    const modes = [
      { id: 'multiple_choice', label: '🎯 Multiple Choice' },
      { id: 'ipa_matching', label: '🎧 IPA Matching' },
      { id: 'fill_blank', label: '📝 Fill in Blank' },
      { id: 'spelling', label: '🔤 Spelling' },
      { id: 'flashcard', label: '🎴 Flashcards 3D' },
    ];

    const container = document.getElementById('quiz-mode-pills');
    if (!container) return;

    container.innerHTML = modes.map((m) => {
      const active = m.id === this.#currentMode
        ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200';
      return `
        <button data-action="quiz.startQuiz" data-action-args="${encodeActionArgs(m.id)}" class="px-4 py-2 rounded-lg text-xs transition ${active}">
          ${m.label}
        </button>`;
    }).join('');
  }

  #renderQuestion() {
    const q = this.#questions[this.#currentIndex];
    const container = document.getElementById('quiz-card-container');
    if (!container || !q) return;

    const progress = Math.round(((this.#currentIndex + 1) / this.#questions.length) * 100);

    let mainContentHtml = '';

    if (q.type === 'flashcard') {
      mainContentHtml = `
        <div class="perspective-1000 my-6 cursor-pointer" data-action="quiz.flipFlashcard">
          <div id="flashcard-inner" class="relative w-full h-56 transition-transform duration-500 transform-style-3d rounded-2xl bg-gradient-to-br from-indigo-900/50 to-gray-800 border border-indigo-500/30 p-6 flex flex-col items-center justify-center text-center shadow-xl">
            <div id="flashcard-front" class="space-y-3">
              <span class="text-xs text-indigo-400 font-semibold uppercase tracking-wider">${escapeHtml(q.front.topicName)}</span>
              <h2 class="text-3xl font-bold text-white tracking-wide">${escapeHtml(q.front.word)}</h2>
              ${q.front.pronunciation ? `<p class="text-sm font-mono text-indigo-300 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/50 inline-block">${escapeHtml(q.front.pronunciation)} 🇺🇸</p>` : ''}
              <p class="text-xs text-gray-500 pt-2">💡 Click để xem mặt sau</p>
            </div>
            <div id="flashcard-back" class="hidden space-y-3">
              <h3 class="text-xl font-bold text-green-400">${escapeHtml(q.back.meaning)}</h3>
              ${q.back.example ? `<p class="text-xs text-gray-300 italic">"Ex: ${escapeHtml(q.back.example)}"</p>` : ''}
              ${q.back.note ? `<p class="text-xs text-gray-400">Note: ${escapeHtml(q.back.note)}</p>` : ''}
            </div>
          </div>
        </div>
        <div class="flex items-center justify-center gap-3 mt-4">
          <button data-action="quiz.submitAnswer" data-action-args='["again"]' class="px-5 py-2.5 bg-red-600/30 border border-red-500/50 hover:bg-red-600 text-red-300 rounded-xl text-xs font-semibold transition">🔴 Chưa thuộc (Again)</button>
          <button data-action="quiz.submitAnswer" data-action-args='["good"]' class="px-5 py-2.5 bg-amber-600/30 border border-amber-500/50 hover:bg-amber-600 text-amber-300 rounded-xl text-xs font-semibold transition">🟡 Tương đối (Good)</button>
          <button data-action="quiz.submitAnswer" data-action-args='["easy"]' class="px-5 py-2.5 bg-green-600/30 border border-green-500/50 hover:bg-green-600 text-green-300 rounded-xl text-xs font-semibold transition">🟢 Thuộc rồi (Easy)</button>
        </div>`;
    } else if (q.type === 'spelling') {
      mainContentHtml = `
        <div class="my-6 space-y-4 text-center">
          <div class="text-sm text-gray-300 font-medium">${q.prompt}</div>
          <div class="text-lg font-mono text-amber-400 bg-gray-900/60 py-3 rounded-xl border border-gray-700 tracking-widest">${escapeHtml(q.scrambled)}</div>
          <div class="max-w-md mx-auto flex gap-2">
            <input id="spelling-input" type="text" placeholder="Gõ từ tiếng Anh chuẩn..." data-keydown-action="quiz.submitSpelling" data-action-key="Enter"
              class="flex-1 px-4 py-2.5 bg-gray-700 rounded-xl border border-gray-600 focus:border-indigo-500 focus:outline-none text-sm text-center font-bold tracking-wider" />
            <button data-action="quiz.submitSpelling" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-semibold transition">Gửi</button>
          </div>
        </div>`;
    } else if (q.type === 'multiple_choice') {
      mainContentHtml = `
        <div class="my-6 space-y-5">
          <div class="text-center space-y-3">
            <p class="text-sm font-semibold text-gray-300">📖 Nghĩa tiếng Việt của từ này là gì?</p>
            <div class="bg-gradient-to-br from-indigo-950/70 to-gray-900 border border-indigo-500/40 rounded-2xl p-6 shadow-xl inline-block min-w-[280px]">
              <h2 class="text-3xl font-extrabold text-white tracking-wide mb-1.5">${escapeHtml(q.word)}</h2>
              ${q.pronunciation ? `<span class="inline-block text-sm font-mono text-indigo-300 bg-indigo-900/60 px-3.5 py-1 rounded-full border border-indigo-700/50 shadow-sm">${escapeHtml(q.pronunciation)} 🇺🇸</span>` : ''}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            ${q.options.map((opt, i) => `
              <button data-action="quiz.submitAnswer" data-action-args="${encodeActionArgs(opt)}" class="quiz-option-btn text-left p-4 rounded-xl bg-gray-700/70 border border-gray-600/60 hover:border-indigo-500 hover:bg-indigo-950/40 text-sm font-medium transition flex items-center gap-3">
                <span class="w-7 h-7 rounded-lg bg-gray-800 border border-gray-600 text-xs font-bold text-gray-400 flex items-center justify-center">${String.fromCharCode(65 + i)}</span>
                <span class="flex-1">${escapeHtml(opt)}</span>
              </button>
            `).join('')}
          </div>
        </div>`;
    } else if (q.type === 'ipa_matching') {
      mainContentHtml = `
        <div class="my-6 space-y-5">
          <div class="text-center space-y-3">
            <p class="text-sm font-semibold text-gray-300">🎧 Phiên âm chuẩn Mỹ này tương ứng với từ tiếng Anh nào?</p>
            <div class="bg-gradient-to-br from-amber-950/50 to-gray-900 border border-amber-500/40 rounded-2xl p-6 shadow-xl inline-block min-w-[280px]">
              <span class="text-3xl font-mono font-bold text-amber-300 tracking-wider">${escapeHtml(q.pronunciation || '/.../')} 🇺🇸</span>
              ${q.meaningHint ? `<p class="text-xs text-gray-400 mt-2">💡 Gợi ý: ${escapeHtml(q.meaningHint)}</p>` : ''}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            ${q.options.map((opt, i) => `
              <button data-action="quiz.submitAnswer" data-action-args="${encodeActionArgs(opt)}" class="quiz-option-btn text-left p-4 rounded-xl bg-gray-700/70 border border-gray-600/60 hover:border-indigo-500 hover:bg-indigo-950/40 text-sm font-medium transition flex items-center gap-3">
                <span class="w-7 h-7 rounded-lg bg-gray-800 border border-gray-600 text-xs font-bold text-gray-400 flex items-center justify-center">${String.fromCharCode(65 + i)}</span>
                <span class="flex-1 font-bold text-base text-gray-200">${escapeHtml(opt)}</span>
              </button>
            `).join('')}
          </div>
        </div>`;
    } else if (q.type === 'fill_blank') {
      const sentenceText = escapeHtml(q.sentence || '').replace(/______/g, '<span class="text-amber-400 font-extrabold underline decoration-amber-400 decoration-4 px-1">______</span>');
      mainContentHtml = `
        <div class="my-6 space-y-5">
          <div class="text-center space-y-3">
            <p class="text-sm font-semibold text-gray-300">📝 Chọn từ đúng điền vào chỗ trống:</p>
            <div class="bg-gradient-to-br from-indigo-950/70 to-gray-900 border border-indigo-500/40 rounded-2xl p-6 shadow-xl inline-block max-w-xl w-full">
              <p class="text-xl font-medium text-white italic leading-relaxed mb-2.5">"${sentenceText}"</p>
              ${q.meaning ? `<span class="inline-block text-xs font-semibold text-indigo-300 bg-indigo-900/60 px-3.5 py-1 rounded-full border border-indigo-700/50 shadow-sm">💡 Gợi ý nghĩa: ${escapeHtml(q.meaning)}</span>` : ''}
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            ${q.options.map((opt, i) => `
              <button data-action="quiz.submitAnswer" data-action-args="${encodeActionArgs(opt)}" class="quiz-option-btn text-left p-4 rounded-xl bg-gray-700/70 border border-gray-600/60 hover:border-indigo-500 hover:bg-indigo-950/40 text-sm font-medium transition flex items-center gap-3">
                <span class="w-7 h-7 rounded-lg bg-gray-800 border border-gray-600 text-xs font-bold text-gray-400 flex items-center justify-center">${String.fromCharCode(65 + i)}</span>
                <span class="flex-1 font-bold text-base text-gray-200">${escapeHtml(opt)}</span>
              </button>
            `).join('')}
          </div>
        </div>`;
    } else {
      mainContentHtml = `
        <div class="my-6 space-y-4">
          <div class="text-base text-gray-200 font-semibold bg-gray-900/50 p-5 rounded-2xl border border-gray-700/60 leading-relaxed text-center">${q.prompt}</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${q.options.map((opt, i) => `
              <button data-action="quiz.submitAnswer" data-action-args="${encodeActionArgs(opt)}" class="quiz-option-btn text-left p-4 rounded-xl bg-gray-700/70 border border-gray-600/60 hover:border-indigo-500 hover:bg-indigo-950/40 text-sm font-medium transition flex items-center gap-3">
                <span class="w-7 h-7 rounded-lg bg-gray-800 border border-gray-600 text-xs font-bold text-gray-400 flex items-center justify-center">${String.fromCharCode(65 + i)}</span>
                <span class="flex-1">${escapeHtml(opt)}</span>
              </button>
            `).join('')}
          </div>
        </div>`;
    }

    container.innerHTML = `
      <div class="bg-gray-800 rounded-2xl p-6 border border-gray-700/80 shadow-2xl">
        <div class="flex items-center justify-between gap-4 border-b border-gray-700/80 pb-4">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-gray-400">Câu ${this.#currentIndex + 1}/${this.#questions.length}</span>
            <div class="w-32 bg-gray-700 rounded-full h-2 overflow-hidden">
              <div class="bg-indigo-500 h-2 rounded-full transition-all duration-300" style="width: ${progress}%"></div>
            </div>
          </div>
          <div class="flex items-center gap-4 text-xs font-bold">
            <span class="text-amber-400">🔥 Streak: ${this.#streak}</span>
            <span class="text-indigo-400">⭐ Điểm: ${this.#score}</span>
          </div>
        </div>
        ${mainContentHtml}
        <div id="quiz-feedback-box" class="hidden mt-4 p-4 rounded-xl text-xs space-y-1"></div>
        <div id="quiz-next-bar" class="hidden mt-4 flex justify-end">
          <button data-action="quiz.nextQuestion" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-2">
            <span>Câu tiếp theo</span> ➔
          </button>
        </div>
      </div>`;
  }

  #renderAnswerFeedback(res) {
    const feedbackBox = document.getElementById('quiz-feedback-box');
    const nextBar = document.getElementById('quiz-next-bar');
    if (!feedbackBox) return;

    const isCorrect = res.isCorrect;
    feedbackBox.className = `mt-4 p-4 rounded-xl text-xs space-y-1 ${isCorrect ? 'bg-green-950/60 border border-green-800 text-green-200' : 'bg-red-950/60 border border-red-800 text-red-200'}`;

    feedbackBox.innerHTML = `
      <div class="font-bold text-sm mb-1">${isCorrect ? '🎉 Chính xác!' : '❌ Chưa chính xác!'}</div>
      <div>Từ: <strong>${escapeHtml(res.explanation.word)}</strong> ${res.explanation.pronunciation ? `<span class="font-mono text-indigo-300">${escapeHtml(res.explanation.pronunciation)}</span>` : ''}</div>
      <div>Nghĩa: ${escapeHtml(res.explanation.meaning)}</div>
      ${res.explanation.example ? `<div class="italic text-gray-400 mt-1">Ex: "${escapeHtml(res.explanation.example)}"</div>` : ''}`;

    feedbackBox.classList.remove('hidden');
    if (nextBar) nextBar.classList.remove('hidden');
  }

  #renderSummary() {
    const container = document.getElementById('quiz-card-container');
    if (!container) return;

    container.innerHTML = `
      <div class="bg-gray-800 rounded-2xl p-8 border border-gray-700/80 shadow-2xl text-center space-y-6">
        <div class="text-4xl">🏆</div>
        <h2 class="text-2xl font-bold text-white">Hoàn thành bài Quiz!</h2>
        <div class="flex items-center justify-center gap-8 my-4">
          <div class="bg-gray-900/60 px-6 py-4 rounded-2xl border border-gray-700">
            <p class="text-xs text-gray-400">Tổng điểm đạt được</p>
            <p class="text-2xl font-bold text-indigo-400 mt-1">+${this.#score} pts</p>
          </div>
          <div class="bg-gray-900/60 px-6 py-4 rounded-2xl border border-gray-700">
            <p class="text-xs text-gray-400">Chuỗi câu đúng (Streak)</p>
            <p class="text-2xl font-bold text-amber-400 mt-1">🔥 ${this.#streak}</p>
          </div>
        </div>
        <div class="flex items-center justify-center gap-4">
          <button data-action="quiz.startQuiz" data-action-args="${encodeActionArgs(this.#currentMode)}" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold transition">
            🔄 Thử lại bài mới
          </button>
        </div>
      </div>`;
    this.loadLeaderboard();
  }

  #playFeedback(isCorrect, msg) {
    this.#showMessage(msg, isCorrect ? 'success' : 'error');
  }

  #showMessage(text, type) {
    const el = document.getElementById('quiz-status-msg');
    if (!el) return;
    if (type === 'none' || !text) {
      el.classList.add('hidden');
      return;
    }
    el.className = `text-xs font-semibold ${type === 'success' ? 'text-green-400' : (type === 'error' ? 'text-red-400' : 'text-indigo-400')}`;
    el.textContent = text;
    el.classList.remove('hidden');
  }
}
