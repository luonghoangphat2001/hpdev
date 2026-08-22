import {
  buildQuiz,
  submitQuiz,
  getQuizLeaderboard,
} from '../../api/learning.js';
import { encodeActionArgs } from '../../app/events.js';
import { escapeHtml } from '../../utils.js';

export const quizFeature = {
  async loadQuiz() {
    this.updateQuizModeControls();
    if (this.quizMode === 'leaderboard') {
      await this.loadQuizLeaderboard();
      return;
    }

    const container = document.getElementById('quiz-container');
    if (!container) return;
    container.innerHTML = `
      <div class="p-6 bg-gray-900 rounded-2xl border border-gray-700 text-center space-y-4">
        <span class="text-3xl">🧩</span>
        <h3 class="text-sm font-bold text-white">Chế độ Luyện Trắc Nghiệm</h3>
        <p class="text-xs text-gray-400">Chọn chủ đề ở trên và bấm <b>Bắt Đầu Làm Bài</b> hoặc <b>AI Soạn Đề</b> để ôn tập!</p>
        <button data-action="learning.startQuizSession" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white shadow">
          ▶ Bắt đầu bài thi ngay
        </button>
      </div>
    `;
  },

  setQuizMode(mode) {
    this.quizMode = mode;
    this.syncUrl();
    this.updateQuizModeControls();

    if (mode === 'leaderboard') {
      this.loadQuizLeaderboard();
      return;
    }

    this.startQuizSession();
  },

  updateQuizModeControls() {
    const mode = this.quizMode;
    const mcBtn = document.getElementById('quiz-mode-mc-btn');
    const spellBtn = document.getElementById('quiz-mode-spell-btn');
    const boardBtn = document.getElementById('quiz-mode-board-btn');

    [mcBtn, spellBtn, boardBtn].forEach(b => {
      b?.classList.remove('bg-indigo-600', 'text-white', 'shadow');
      b?.classList.add('text-gray-400');
    });

    if (mode === 'multiple_choice') {
      mcBtn?.classList.add('bg-indigo-600', 'text-white', 'shadow');
      mcBtn?.classList.remove('text-gray-400');
    } else if (mode === 'spelling') {
      spellBtn?.classList.add('bg-indigo-600', 'text-white', 'shadow');
      spellBtn?.classList.remove('text-gray-400');
    } else if (mode === 'leaderboard') {
      boardBtn?.classList.add('bg-indigo-600', 'text-white', 'shadow');
      boardBtn?.classList.remove('text-gray-400');
    }
  },

  async startQuizSession() {
    if (this.quizAutoAdvanceTimer) {
      clearTimeout(this.quizAutoAdvanceTimer);
      this.quizAutoAdvanceTimer = null;
    }
    if (this.quizCountdownTimer) {
      clearInterval(this.quizCountdownTimer);
      this.quizCountdownTimer = null;
    }
    if (this.quizMode === 'leaderboard') {
      this.quizMode = 'multiple_choice';
      this.updateQuizModeControls();
      this.syncUrl();
    }
    const topicNo = document.getElementById('quiz-topic-select')?.value || null;
    const count = document.getElementById('quiz-count-select')?.value || 5;

    const res = await buildQuiz(topicNo, count, this.quizMode);
    if (!res?.ok || !res.questions?.length) {
      alert(res?.error || 'Không thể tạo đề thi');
      return;
    }

    this.quizQuestions = res.questions;
    this.currentQuizIndex = 0;
    this.quizScore = 0;
    this.quizStreak = 0;
    this.quizAnswered = false;
    this.quizFinishing = false;
    this.quizAttemptDetails = [];

    this.renderCurrentQuizQuestion();
  },

  renderCurrentQuizQuestion() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    if (this.currentQuizIndex >= this.quizQuestions.length) {
      this.renderQuizGameOver();
      return;
    }

    const q = this.quizQuestions[this.currentQuizIndex];
    const total = this.quizQuestions.length;
    const progressPct = ((this.currentQuizIndex) / total) * 100;
    this.quizAnswered = false;

    if (this.quizMode === 'spelling') {
      container.innerHTML = `
        <div class="bg-gray-800/90 rounded-2xl p-6 border border-gray-700/80 shadow-2xl space-y-6">
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span>Câu hỏi <b>${this.currentQuizIndex + 1}</b> / ${total}</span>
            <span>Streak: <b class="text-amber-400">🔥 ${this.quizStreak}</b> | Điểm: <b class="text-emerald-400">${this.quizScore}</b></span>
          </div>
          <div class="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
            <div class="bg-indigo-500 h-full transition-all" style="width: ${progressPct}%"></div>
          </div>

          <div class="text-center space-y-2 py-4">
            <span class="text-xs text-indigo-400 font-bold uppercase tracking-wider">Điền từ đúng vào ô trống</span>
            <h3 class="text-2xl font-black text-white">${q.correct_meaning}</h3>
            ${q.pronunciation ? `<span class="text-sm font-mono text-gray-400">${q.pronunciation}</span>` : ''}
            <p class="text-xs text-gray-400 italic">${q.example ? q.example.replace(new RegExp(q.word, 'gi'), '______') : ''}</p>
          </div>

          <div class="max-w-md mx-auto space-y-3">
            <input id="quiz-spelling-input" type="text" placeholder="Nhập từ tiếng Anh..." autofocus
              data-keydown-action="learning.submitSpellingAnswer" data-action-key="Enter"
              class="w-full px-4 py-3 bg-gray-900 rounded-xl border border-gray-700 text-white font-bold text-center text-sm focus:border-indigo-500 focus:outline-none" />
            <button data-action="learning.submitSpellingAnswer" id="quiz-spell-submit-btn"
              class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white transition shadow">
              Kiểm tra đáp án
            </button>
          </div>

          <div id="quiz-spelling-result" class="hidden text-center text-xs"></div>
        </div>
      `;
      return;
    }

    // Multiple Choice
    container.innerHTML = `
      <div class="bg-gray-800/90 rounded-2xl p-6 border border-gray-700/80 shadow-2xl space-y-6">
        <div class="flex items-center justify-between text-xs text-gray-400">
          <span>Câu hỏi <b>${this.currentQuizIndex + 1}</b> / ${total}</span>
          <span>Streak: <b class="text-amber-400">🔥 ${this.quizStreak}</b> | Điểm: <b class="text-emerald-400">${this.quizScore}</b></span>
        </div>
        <div class="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
          <div class="bg-indigo-500 h-full transition-all" style="width: ${progressPct}%"></div>
        </div>

        <div class="text-center space-y-2 py-4">
          <span class="text-xs text-indigo-400 font-bold uppercase tracking-wider">Từ vựng tiếng Anh</span>
          <h3 class="text-3xl font-black text-white">${q.word}</h3>
          ${q.pronunciation ? `<span class="text-sm font-mono text-gray-400">${q.pronunciation}</span>` : ''}
          <p class="text-xs text-gray-300 italic max-w-lg mx-auto">${q.example || ''}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="quiz-options-grid">
          ${q.options.map((opt, index) => {
      const letter = opt.slice(0, 1);
      return `
              <button data-action="learning.selectQuizOption" data-action-args="${encodeActionArgs(letter)}" id="quiz-opt-${letter}"
                class="p-4 rounded-xl text-left text-xs font-semibold bg-gray-900 border border-gray-700 text-gray-200 hover:border-indigo-500 hover:bg-gray-750 transition flex items-center justify-between">
                <span>${opt}</span>
                <span class="text-gray-400 font-mono text-[10px] shrink-0 ml-3"></span>
              </button>
            `;
    }).join('')}
        </div>

        <div id="quiz-explanation-box" class="hidden p-4 rounded-xl text-xs space-y-2"></div>
      </div>
    `;
  },

  selectQuizOption(letter) {
    if (this.quizAnswered) return;
    this.quizAnswered = true;

    const q = this.quizQuestions[this.currentQuizIndex];
    const isCorrect = letter === q.correct_option;
    const selectedAnswer = q.options.find((option) => option.slice(0, 1) === letter) || letter;
    const correctAnswer = q.options.find((option) => option.slice(0, 1) === q.correct_option) || q.correct_option;
    const isLastQuestion = this.currentQuizIndex === this.quizQuestions.length - 1;
    const shouldAutoAdvance = isCorrect || isLastQuestion;
    this.quizAttemptDetails.push({
      item_id: q.id,
      is_correct: isCorrect,
      question: q.word,
      selected_answer: selectedAnswer,
      correct_answer: correctAnswer,
    });
    const box = document.getElementById('quiz-explanation-box');

    const selectedBtn = document.getElementById(`quiz-opt-${letter}`);
    const correctBtn = document.getElementById(`quiz-opt-${q.correct_option}`);

    if (isCorrect) {
      this.quizScore++;
      this.quizStreak++;
      selectedBtn?.classList.add('bg-emerald-900/60', 'border-emerald-500', 'text-emerald-200');
    } else {
      this.quizStreak = 0;
      selectedBtn?.classList.add('bg-red-900/60', 'border-red-500', 'text-red-200');
      correctBtn?.classList.add('bg-emerald-900/60', 'border-emerald-500', 'text-emerald-200');
    }

    if (box) {
      box.classList.remove('hidden');
      box.className = `p-4 rounded-xl text-xs space-y-2 border ${isCorrect ? 'bg-emerald-950/40 border-emerald-800' : 'bg-red-950/40 border-red-800'}`;
      box.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}">
            ${isCorrect ? '🎉 Chính xác!' : `❌ Chưa đúng! Đáp án đúng là: ${q.correct_option}`}
          </span>
          ${shouldAutoAdvance
            ? `<span class="${isCorrect ? 'text-emerald-300' : 'text-amber-300'} font-semibold">${isLastQuestion
              ? (isCorrect ? 'Mở thống kê sau <b id="quiz-auto-countdown">5</b> giây…' : 'Đang mở thống kê…')
              : 'Tự chuyển câu tiếp theo sau <b id="quiz-auto-countdown">5</b> giây…'}</span>`
            : `<button data-action="learning.nextQuizQuestion" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold">
                Câu tiếp theo →
              </button>`}
        </div>
        <p class="text-gray-300">${q.note || q.correct_meaning}</p>
      `;
    }

    if (shouldAutoAdvance) {
      const answeredIndex = this.currentQuizIndex;
      if (isCorrect) {
        let secondsLeft = 5;
        this.quizCountdownTimer = setInterval(() => {
          secondsLeft -= 1;
          const countdown = document.getElementById('quiz-auto-countdown');
          if (countdown) countdown.textContent = String(Math.max(secondsLeft, 0));
          if (secondsLeft <= 0 && this.quizCountdownTimer) {
            clearInterval(this.quizCountdownTimer);
            this.quizCountdownTimer = null;
          }
        }, 1000);
      }
      this.quizAutoAdvanceTimer = setTimeout(() => {
        this.quizAutoAdvanceTimer = null;
        if (this.quizCountdownTimer) {
          clearInterval(this.quizCountdownTimer);
          this.quizCountdownTimer = null;
        }
        if (this.currentQuizIndex === answeredIndex && this.quizAnswered) {
          this.nextQuizQuestion();
        }
      }, isCorrect ? 5000 : 1100);
    }
  },

  handleQuizKeyboardShortcut(event) {
    const optionsGrid = document.getElementById('quiz-options-grid');
    if (
      !optionsGrid
      || optionsGrid.getClientRects().length === 0
      || this.quizAnswered
      || !this.quizQuestions?.length
      || this.currentQuizIndex >= this.quizQuestions.length
    ) return;

    const target = event.target;
    const tagName = target?.tagName?.toLowerCase();
    if (target?.isContentEditable || ['input', 'textarea', 'select'].includes(tagName)) return;

    const codeMatch = /^(?:Digit|Numpad)([1-4])$/.exec(event.code || '');
    const pressedNumber = codeMatch ? Number(codeMatch[1]) : Number(event.key);
    const optionIndex = pressedNumber - 1;
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) return;
    const option = this.quizQuestions[this.currentQuizIndex]?.options?.[optionIndex];
    if (!option) return;

    event.preventDefault();
    this.selectQuizOption(option.slice(0, 1));
  },

  submitSpellingAnswer() {
    if (this.quizAnswered) return;
    const input = document.getElementById('quiz-spelling-input');
    const val = input?.value?.trim().toLowerCase();
    if (!val) return;

    this.quizAnswered = true;
    const q = this.quizQuestions[this.currentQuizIndex];
    const isCorrect = val === q.word.toLowerCase().trim();
    const isLastQuestion = this.currentQuizIndex === this.quizQuestions.length - 1;
    this.quizAttemptDetails.push({
      item_id: q.id,
      is_correct: isCorrect,
      question: q.correct_meaning || q.word,
      selected_answer: val,
      correct_answer: q.word,
    });
    const resultBox = document.getElementById('quiz-spelling-result');

    if (isCorrect) {
      this.quizScore++;
      this.quizStreak++;
      input?.classList.add('border-emerald-500', 'bg-emerald-950/40');
    } else {
      this.quizStreak = 0;
      input?.classList.add('border-red-500', 'bg-red-950/40');
    }

    if (resultBox) {
      resultBox.classList.remove('hidden');
      resultBox.innerHTML = `
        <div class="p-3 rounded-xl ${isCorrect ? 'bg-emerald-950/60 text-emerald-300' : 'bg-red-950/60 text-red-300'} space-y-2">
          <p class="font-bold">${isCorrect ? '🎉 Tuyệt vời!' : `Đáp án đúng là: <b class="text-white">${q.word}</b>`}</p>
          ${isLastQuestion
            ? '<p class="font-semibold text-amber-300">Đang mở thống kê…</p>'
            : `<button data-action="learning.nextQuizQuestion" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold">
                Câu tiếp theo →
              </button>`}
        </div>
      `;
    }

    if (isLastQuestion) {
      const answeredIndex = this.currentQuizIndex;
      this.quizAutoAdvanceTimer = setTimeout(() => {
        this.quizAutoAdvanceTimer = null;
        if (this.currentQuizIndex === answeredIndex && this.quizAnswered) {
          this.nextQuizQuestion();
        }
      }, 900);
    }
  },

  nextQuizQuestion() {
    if (this.quizAutoAdvanceTimer) {
      clearTimeout(this.quizAutoAdvanceTimer);
      this.quizAutoAdvanceTimer = null;
    }
    if (this.quizCountdownTimer) {
      clearInterval(this.quizCountdownTimer);
      this.quizCountdownTimer = null;
    }
    this.currentQuizIndex++;
    this.renderCurrentQuizQuestion();
  },

  async renderQuizGameOver() {
    const container = document.getElementById('quiz-container');
    if (!container || this.quizFinishing) return;
    this.quizFinishing = true;

    const total = this.quizQuestions.length;
    const pct = Math.round((this.quizScore / total) * 100);
    const wrongCount = total - this.quizScore;

    container.innerHTML = `
      <div class="bg-gray-800/90 rounded-2xl p-8 border border-gray-700/80 text-center max-w-lg mx-auto shadow-2xl space-y-4">
        <span class="text-4xl animate-pulse">📊</span>
        <p class="text-sm font-bold text-white">Đang tổng hợp kết quả…</p>
      </div>
    `;

    // Save result to server
    let resultSaved = true;
    try {
      await submitQuiz(this.quizScore, total, {
        pct,
        mode: this.quizMode,
        attempts: this.quizAttemptDetails || [],
      });
    } catch (_) {
      resultSaved = false;
    }

    const reviewHtml = (this.quizAttemptDetails || []).map((attempt, index) => `
      <div class="p-3.5 rounded-xl border text-left ${attempt.is_correct
        ? 'bg-emerald-950/30 border-emerald-800/60'
        : 'bg-red-950/30 border-red-800/60'}">
        <div class="flex items-start gap-3">
          <span class="shrink-0 text-lg" aria-hidden="true">${attempt.is_correct ? '✅' : '❌'}</span>
          <div class="min-w-0 flex-1 space-y-1.5">
            <p class="text-xs font-bold text-white">Câu ${index + 1}: ${escapeHtml(attempt.question || `#${attempt.item_id}`)}</p>
            <p class="text-[11px] text-gray-300">Bạn trả lời: <b class="${attempt.is_correct ? 'text-emerald-300' : 'text-red-300'}">${escapeHtml(attempt.selected_answer || 'Không trả lời')}</b></p>
            ${attempt.is_correct ? '' : `<p class="text-[11px] text-gray-300">Đáp án đúng: <b class="text-emerald-300">${escapeHtml(attempt.correct_answer || '')}</b></p>`}
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="bg-gray-800/90 rounded-2xl p-5 sm:p-7 border border-gray-700/80 max-w-3xl mx-auto shadow-2xl space-y-5">
        <div class="text-center space-y-3">
        <span class="text-5xl">${pct >= 80 ? '🏆' : (pct >= 50 ? '👍' : '💪')}</span>
        <div>
          <h2 class="text-2xl font-black text-white">Hoàn Thành Bài Thi!</h2>
          <p class="text-xs ${resultSaved ? 'text-gray-400' : 'text-amber-400'} mt-1">${resultSaved ? 'Kết quả đã được tự động lưu vào lịch sử' : 'Đã hiện kết quả; chưa thể lưu lịch sử lúc này'}</p>
        </div>
        </div>

        <div class="p-4 bg-gray-900 rounded-2xl border border-gray-700 grid grid-cols-3 gap-3 text-center">
          <div>
            <span class="text-xs text-gray-400 block">Câu đúng</span>
            <span class="text-2xl font-black text-emerald-400">${this.quizScore}</span>
          </div>
          <div>
            <span class="text-xs text-gray-400 block">Câu sai</span>
            <span class="text-2xl font-black text-red-400">${wrongCount}</span>
          </div>
          <div>
            <span class="text-xs text-gray-400 block">Chính xác</span>
            <span class="text-2xl font-black text-indigo-400">${pct}%</span>
          </div>
        </div>

        <div class="space-y-2">
          <h3 class="text-sm font-bold text-white">📋 Chi tiết câu đúng và câu sai</h3>
          <div class="space-y-2 max-h-[55vh] overflow-y-auto overscroll-contain pr-1">${reviewHtml}</div>
        </div>

        <div class="flex items-center justify-center gap-3 pt-2">
          <button data-action="learning.startQuizSession" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow">
            🔄 Làm bài thi khác
          </button>
          <button data-action="learning.setQuizMode" data-action-args='["leaderboard"]' class="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold rounded-xl text-xs shadow">
            🏆 Xem Bảng Xếp Hạng
          </button>
        </div>
      </div>
    `;
  },

  async loadQuizLeaderboard() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    const res = await getQuizLeaderboard(10);
    const board = res?.leaderboard || [];

    container.innerHTML = `
      <div class="bg-gray-800/90 rounded-2xl p-6 border border-gray-700/80 shadow-2xl space-y-4 max-w-2xl mx-auto">
        <div class="flex items-center justify-between border-b border-gray-700 pb-3">
          <h3 class="font-bold text-white text-sm flex items-center gap-2">
            <span>🏆</span> Bảng Xếp Hạng Luyện Tập
          </h3>
          <button data-action="learning.setQuizMode" data-action-args='["multiple_choice"]' class="text-xs text-indigo-400 hover:text-indigo-300">
            ← Quay lại làm bài
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-gray-300">
            <thead class="bg-gray-900 text-gray-400 uppercase font-semibold">
              <tr>
                <th class="px-4 py-2.5">Hạng</th>
                <th class="px-4 py-2.5">Học viên</th>
                <th class="px-4 py-2.5 text-center">Số bài</th>
                <th class="px-4 py-2.5 text-right">Điểm TB</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">
              ${board.length ? board.map((u, i) => `
                <tr class="hover:bg-gray-750/50">
                  <td class="px-4 py-2.5 font-bold ${i === 0 ? 'text-amber-400' : (i === 1 ? 'text-gray-300' : (i === 2 ? 'text-amber-600' : 'text-gray-500'))}">
                    #${i + 1}
                  </td>
                  <td class="px-4 py-2.5 font-bold text-white">${u.username}</td>
                  <td class="px-4 py-2.5 text-center text-gray-400 font-mono">${u.total_quizzes}</td>
                  <td class="px-4 py-2.5 text-right font-black text-emerald-400 font-mono">${u.avg_score}</td>
                </tr>
              `).join('') : '<tr><td colspan="4" class="px-4 py-6 text-center text-gray-500">Chưa có ai hoàn thành bài kiểm tra</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
};
