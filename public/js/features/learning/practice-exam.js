import {
  buildQuiz,
  buildPracticeExam,
  getLearnings,
  submitPracticeExam,
} from '../../api/learning.js';
import { encodeActionArgs } from '../../app/events.js';
import { escapeHtml } from '../../utils.js';

const TECH_EXAM_SLUGS = new Set(['php', 'nextjs', 'python', 'reactjs', 'javascript', 'nodejs']);
const EXAM_COUNT = 50;

function text(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join('\n');
  return JSON.stringify(value, null, 2);
}

function optionText(option) {
  if (!option || typeof option !== 'object') return text(option);
  return text(option.text ?? option.label ?? option.value ?? option.answer);
}

function correctOptionIndex(options, expected) {
  const flagged = options.findIndex((option) => option && typeof option === 'object'
    && [true, 1, '1', 'true'].includes(option.is_correct ?? option.correct));
  if (flagged >= 0) return flagged;
  if (expected === undefined || expected === null || expected === '') return -1;
  if (Number.isInteger(expected) && expected >= 0 && expected < options.length) return expected;
  const normalized = String(expected).trim();
  const letter = normalized.match(/^([A-Z])(?:[.):\-]|$)/i)?.[1]?.toUpperCase();
  if (letter) {
    const index = letter.charCodeAt(0) - 65;
    if (index >= 0 && index < options.length) return index;
  }
  return options.findIndex((option) => optionText(option).trim().toLowerCase() === normalized.toLowerCase());
}

function shuffled(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function normalizeGeneratedQuizQuestion(question) {
  const options = Array.isArray(question.options) ? question.options : [];
  return {
    ...question,
    type: 'quiz',
    title: question.word || `Quiz #${question.id}`,
    displayPrompt: `Chọn nghĩa đúng của “${question.word || ''}”`,
    context: question.example || '',
    options,
    correctIndex: correctOptionIndex(options, question.correct_option),
    answer: question.correct_meaning || '',
    learning_name: 'Quiz & Practice',
    difficulty: question.difficulty || question.level || 'mixed',
  };
}

export function normalizePracticeQuestion(item, nestedQuestion = null, nestedIndex = -1) {
  const content = item.content || {};
  const nested = nestedQuestion || (Array.isArray(content.questions) ? content.questions[0] : null);
  const source = nested || content;
  const options = Array.isArray(source.options) ? source.options : [];
  const expected = source.correct_answer ?? source.correct_option ?? source.answer
    ?? content.correct_answer ?? content.correct_option ?? content.answer;
  const sample = item.sample_solution || {};
  const answer = source.explanation ?? source.answer_explanation ?? sample.model_answer
    ?? sample.answer ?? content.detailed_answer ?? content.quick_answer ?? item.sample_solution;

  return {
    ...item,
    title: nested ? `${item.title} — Câu ${(nestedIndex >= 0 ? nestedIndex : 0) + 1}` : item.title,
    displayPrompt: text(source.question ?? item.prompt ?? item.title),
    context: text(nested ? item.prompt : (content.passage ?? content.text ?? content.scenario)),
    options,
    correctIndex: correctOptionIndex(options, expected),
    answer: text(answer),
  };
}

/** Expand DB-stored reading/quiz passages into their actual child questions. */
export function expandPracticeQuestions(items, count = EXAM_COUNT) {
  const expanded = (Array.isArray(items) ? items : []).flatMap((item) => {
    const questions = item.content?.questions;
    if (!Array.isArray(questions) || !questions.length) return [normalizePracticeQuestion(item)];
    return questions.map((question, index) => normalizePracticeQuestion(item, question, index));
  });
  return expanded.slice(0, count);
}

export const practiceExamFeature = {
  practiceExamContainer(category = this.practiceExamCategory) {
    return document.getElementById(`${category}-practice-exam`);
  },

  async loadPracticeExam(category) {
    this.practiceExamCategory = category;
    this.practiceExamQuestions = [];
    this.practiceExamAttempts = [];
    this.practiceExamIndex = 0;
    const container = this.practiceExamContainer(category);
    if (!container) return;
    container.innerHTML = '<div class="p-8 text-center text-xs text-gray-400">⏳ Đang tải danh sách môn học...</div>';

    let response;
    try {
      response = await getLearnings(category);
    } catch (error) {
      container.innerHTML = `<div class="p-8 text-center text-red-400">${escapeHtml(error.message || 'Không tải được danh sách môn học.')}</div>`;
      return;
    }
    if (!response?.ok) {
      container.innerHTML = '<div class="p-8 text-center text-red-400">Không tải được danh sách môn học.</div>';
      return;
    }
    const allLearnings = response.learnings || [];
    const englishTypes = new Set(['reading', 'writing', 'quiz', 'ielts']);
    if (category === 'tech') {
      this.practiceExamLearnings = allLearnings.filter((learning) => TECH_EXAM_SLUGS.has(learning.slug));
    } else {
      this.practiceExamQuizTopics = allLearnings.filter((learning) => learning.type === 'vocabulary');
      const vocabularyCount = allLearnings
        .filter((learning) => learning.type === 'vocabulary')
        .reduce((total, learning) => total + (Number(learning.active_item_count) || 0), 0);
      const byType = new Map();
      allLearnings.filter((learning) => englishTypes.has(learning.type)).forEach((learning) => {
        const existing = byType.get(learning.type);
        if (!existing || Number(learning.active_item_count) > Number(existing.active_item_count)) {
          byType.set(learning.type, { ...learning });
        }
      });
      const quizLearning = byType.get('quiz');
      if (quizLearning) {
        quizLearning.name = `Quiz — ${this.practiceExamQuizTopics.length} Topics`;
        quizLearning.active_item_count = vocabularyCount;
        quizLearning.count_source = 'vocabulary';
      } else if (this.practiceExamQuizTopics.length) {
        byType.set('quiz', {
          slug: 'english-quiz',
          type: 'quiz',
          name: `Quiz — ${this.practiceExamQuizTopics.length} Topics`,
          icon: '🎯',
          active_item_count: vocabularyCount,
          count_source: 'vocabulary',
        });
      }
      this.practiceExamLearnings = [...byType.values()];
    }
    this.renderPracticeExamSetup();
  },

  renderPracticeExamSetup() {
    const category = this.practiceExamCategory;
    const container = this.practiceExamContainer(category);
    if (!container) return;
    const tech = category === 'tech';
    const selectedSlug = TECH_EXAM_SLUGS.has(this.activeTechSlug)
      ? this.activeTechSlug
      : this.practiceExamLearnings[0]?.slug;

    container.innerHTML = `
      <div class="bg-gray-800/90 rounded-2xl border border-gray-700/80 shadow-xl p-6 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-black text-white">📝 Thi thử ${tech ? 'Tech' : 'English'} — ${EXAM_COUNT} câu</h2>
            <p class="text-xs text-gray-400 mt-1">Đề lấy ngẫu nhiên từ ngân hàng câu hỏi trong hệ thống, không tạo câu hỏi bằng AI.</p>
          </div>
          <span class="px-3 py-1.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold">Database only</span>
        </div>

        <div>
          <p class="text-xs font-bold text-gray-300 mb-3">${tech ? 'Chọn một ngôn ngữ / framework' : 'Chọn nội dung muốn thi'}</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            ${this.practiceExamLearnings.map((learning) => `
              <label class="practice-learning-option relative cursor-pointer rounded-xl border p-3 transition flex items-center gap-2.5 select-none">
                <input type="${tech ? 'radio' : 'checkbox'}" name="practice-learning-${category}" value="${escapeHtml(learning.slug)}"
                  ${tech ? (learning.slug === selectedSlug ? 'checked' : '') : 'checked'} class="practice-learning-input"
                  ${!tech && learning.type === 'quiz' ? 'data-change-action="learning.togglePracticeExamQuizTopic" data-pass-element="true"' : ''} />
                <span class="min-w-0 flex-1">
                  <span class="block text-xs font-bold text-white truncate">${escapeHtml(learning.name)}</span>
                  <span class="practice-learning-count text-[10px]">${Number(learning.active_item_count) || 0} ${learning.count_source === 'vocabulary' ? 'từ trong kho' : 'câu trong kho'}</span>
                </span>
              </label>
            `).join('')}
          </div>
        </div>

        ${!tech && this.practiceExamQuizTopics.length ? `
          <div id="practice-exam-quiz-topic-wrap" class="max-w-md rounded-xl border border-indigo-900/70 bg-indigo-950/20 p-4 transition-all duration-300">
            <label for="practice-exam-quiz-topic" class="block text-xs font-bold text-indigo-200 mb-2">🧩 Phạm vi Topic cho phần Quiz</label>
            <select id="practice-exam-quiz-topic" class="w-full h-10 px-3 rounded-xl border border-gray-600 bg-gray-900 text-xs text-white focus:border-indigo-500 focus:outline-none">
              <option value="">Tất cả ${this.practiceExamQuizTopics.length} Topics</option>
              ${this.practiceExamQuizTopics.map((topic) => `<option value="${Number(topic.topic_no) || ''}">${escapeHtml(topic.name || `Topic ${topic.topic_no}`)} — ${Number(topic.active_item_count) || 0} từ</option>`).join('')}
            </select>
            <p class="mt-1.5 text-[11px] text-gray-500">Câu Quiz được lấy từ từ vựng trong Topic đã chọn, không gọi AI tạo đề.</p>
          </div>
        ` : ''}

        ${!tech ? `
          <div class="max-w-sm">
            <label for="practice-exam-level-english" class="block text-xs font-bold text-gray-300 mb-2">Chọn Level đề thi</label>
            <select id="practice-exam-level-english" class="w-full h-11 px-3 rounded-xl border border-gray-600 bg-gray-900 text-sm text-white focus:border-indigo-500 focus:outline-none">
              <option value="" ${!this.englishFilterLevel ? 'selected' : ''}>🎲 Lộn xộn — Tất cả Level</option>
              <option value="beginner" ${this.englishFilterLevel === 'beginner' ? 'selected' : ''}>🌱 A1–A2 / Beginner</option>
              <option value="junior" ${this.englishFilterLevel === 'junior' ? 'selected' : ''}>🔰 B1 / Junior</option>
              <option value="intermediate" ${this.englishFilterLevel === 'intermediate' ? 'selected' : ''}>⚙️ B2 / Intermediate</option>
              <option value="advanced" ${this.englishFilterLevel === 'advanced' ? 'selected' : ''}>🚀 C1 / Advanced</option>
            </select>
            <p class="mt-1.5 text-[11px] text-gray-500">Level áp dụng cho cả nội dung English và Quiz từ vựng.</p>
          </div>
        ` : ''}

        ${tech ? `
          <div class="max-w-sm">
            <label for="practice-exam-level-tech" class="block text-xs font-bold text-gray-300 mb-2">Chọn Level đề thi</label>
            <select id="practice-exam-level-tech" class="w-full h-11 px-3 rounded-xl border border-gray-600 bg-gray-900 text-sm text-white focus:border-indigo-500 focus:outline-none">
              <option value="">🎲 Lộn xộn — Tất cả Level</option>
              <option value="beginner">🌱 Beginner / Fresher</option>
              <option value="junior">🔰 Junior</option>
              <option value="intermediate">⚙️ Intermediate</option>
              <option value="advanced">🚀 Advanced / Senior</option>
            </select>
            <p class="mt-1.5 text-[11px] text-gray-500">Lộn xộn sẽ trộn câu hỏi từ dễ đến khó trong cùng ngôn ngữ đã chọn.</p>
          </div>
        ` : ''}

        <div class="rounded-xl border border-amber-800/50 bg-amber-950/20 p-4 text-xs text-amber-200">
          Câu sai sẽ xuất hiện thường xuyên hơn ở các lần thi sau; câu đã làm đúng sẽ giảm tần suất.
        </div>
        <button data-action="learning.startPracticeExam" data-action-args="${encodeActionArgs(category)}"
          class="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-black shadow transition">
          ▶ Bắt đầu đề ${EXAM_COUNT} câu
        </button>
      </div>
    `;
  },

  togglePracticeExamQuizTopic(input) {
    const topicScope = document.getElementById('practice-exam-quiz-topic-wrap');
    topicScope?.classList.toggle('hidden', !input?.checked);
  },

  async startPracticeExam(category) {
    const container = this.practiceExamContainer(category);
    if (!container) return;
    const selected = [...document.querySelectorAll(`input[name="practice-learning-${category}"]:checked`)]
      .map((input) => input.value);
    if (!selected.length) {
      alert('Vui lòng chọn ít nhất một nội dung thi.');
      return;
    }
    const learnings = category === 'tech' ? selected.slice(0, 1) : selected;
    const selectedEnglishTypes = category === 'english'
      ? [...new Set(this.practiceExamLearnings
        .filter((learning) => selected.includes(learning.slug))
        .map((learning) => learning.type)
        .filter(Boolean))]
      : [];
    const selectedQuizTopicNo = category === 'english'
      ? (Number(document.getElementById('practice-exam-quiz-topic')?.value) || null)
      : null;
    this.practiceExamLevel = category === 'tech'
      ? (document.getElementById('practice-exam-level-tech')?.value || '')
      : (document.getElementById('practice-exam-level-english')?.value || '');
    container.innerHTML = `<div class="p-10 text-center text-sm text-gray-300">⏳ Đang chọn 50 câu ${this.practiceExamLevel ? `level ${escapeHtml(this.practiceExamLevel)}` : 'lộn xộn'} từ ngân hàng hệ thống...</div>`;
    let response = { ok: true, questions: [] };
    try {
      response = await buildPracticeExam({
        count: EXAM_COUNT,
        category,
        // English quiz items may live under vocabulary-topic learnings. Filter
        // English exams by the selected content types across the whole category.
        learnings: category === 'tech' ? learnings : [],
        level: this.practiceExamLevel,
        types: category === 'tech' ? ['tech_question'] : selectedEnglishTypes,
      });
    } catch (error) {
      container.innerHTML = `<div class="p-8 text-center text-red-400">${escapeHtml(error.message || 'Không lấy được đề thi từ ngân hàng.')}</div>`;
      return;
    }

    let generatedQuizQuestions = [];
    const needsVocabularyQuiz = category === 'english'
      && selectedEnglishTypes.includes('quiz')
      && !(response.questions || []).some((question) => question.type === 'quiz');
    if (needsVocabularyQuiz) {
      try {
        const quizResponse = await buildQuiz(selectedQuizTopicNo, EXAM_COUNT, 'multiple_choice', this.practiceExamLevel);
        generatedQuizQuestions = (quizResponse?.questions || []).map(normalizeGeneratedQuizQuestion);
      } catch (_) {}
    }

    if (!response?.ok || (!(response.questions || []).length && !generatedQuizQuestions.length)) {
      container.innerHTML = `<div class="p-8 text-center text-red-400">${escapeHtml(response?.error || 'Ngân hàng chưa có câu hỏi phù hợp.')}</div>`;
      return;
    }
    const questions = category === 'english'
      ? shuffled([
        ...expandPracticeQuestions(response.questions || [], EXAM_COUNT),
        ...generatedQuizQuestions,
      ]).slice(0, EXAM_COUNT)
      : response.questions.map((item) => normalizePracticeQuestion(item)).slice(0, EXAM_COUNT);
    this.practiceExamQuestions = category === 'tech' && !this.practiceExamLevel
      ? shuffled(questions)
      : questions;
    this.practiceExamAttempts = [];
    this.practiceExamIndex = 0;
    this.practiceExamAnswered = false;
    this.practiceExamReveal = false;
    this.practiceExamDraft = '';
    this.renderPracticeExamQuestion();
  },

  renderPracticeExamQuestion() {
    const container = this.practiceExamContainer();
    if (!container) return;
    const question = this.practiceExamQuestions[this.practiceExamIndex];
    if (!question) {
      this.finishPracticeExam();
      return;
    }
    const current = this.practiceExamIndex + 1;
    const total = this.practiceExamQuestions.length;
    const progress = Math.round(((current - 1) / total) * 100);
    const hasChoices = question.options.length > 1 && question.correctIndex >= 0;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto bg-gray-800/90 rounded-2xl border border-gray-700/80 shadow-xl p-5 sm:p-7 space-y-5">
        <div class="flex items-center justify-between text-xs text-gray-400">
          <span>Câu <b class="text-white">${current}</b> / ${total}</span>
          <div class="flex gap-2">
            <span class="px-2 py-0.5 rounded bg-gray-700">${escapeHtml(question.learning_name || '')}</span>
            <span class="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300">${escapeHtml(question.difficulty || question.level || '')}</span>
          </div>
        </div>
        <div class="h-2 rounded-full overflow-hidden bg-gray-700"><div class="h-full bg-indigo-500 transition-all" style="width:${progress}%"></div></div>
        ${question.context ? `<div class="max-h-56 overflow-y-auto whitespace-pre-wrap p-4 rounded-xl bg-gray-950/70 border border-gray-700 text-xs leading-6 text-gray-300">${escapeHtml(question.context)}</div>` : ''}
        <div>
          <h3 class="text-lg font-bold text-white">${escapeHtml(question.title)}</h3>
          <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-300">${escapeHtml(question.displayPrompt)}</p>
        </div>
        ${hasChoices ? `
          <div class="grid gap-3">
            ${question.options.map((option, index) => {
              const attempt = this.practiceExamAttempts[this.practiceExamIndex];
              const selected = attempt?.selectedIndex === index;
              const correct = this.practiceExamAnswered && question.correctIndex === index;
              const wrong = this.practiceExamAnswered && selected && !attempt?.is_correct;
              const style = correct ? 'border-emerald-500 bg-emerald-950/50 text-emerald-200'
                : (wrong ? 'border-red-500 bg-red-950/50 text-red-200' : 'border-gray-700 bg-gray-900 text-gray-200 hover:border-indigo-500');
              return `<button ${this.practiceExamAnswered ? 'disabled' : ''} data-action="learning.answerPracticeExamChoice" data-action-args="${encodeActionArgs(index)}" class="p-4 rounded-xl border text-left text-sm transition ${style}"><b class="mr-2">${String.fromCharCode(65 + index)}.</b>${escapeHtml(optionText(option))}</button>`;
            }).join('')}
          </div>
        ` : `
          <textarea id="practice-exam-answer" ${this.practiceExamReveal ? 'disabled' : ''} rows="6" placeholder="Nhập câu trả lời của bạn trước khi xem đáp án..." class="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-sm text-white focus:border-indigo-500 focus:outline-none">${escapeHtml(this.practiceExamDraft || '')}</textarea>
          ${!this.practiceExamReveal ? `<button data-action="learning.revealPracticeExamAnswer" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white">Xem đáp án để tự chấm</button>` : ''}
        `}
        ${(this.practiceExamAnswered || this.practiceExamReveal) ? `
          <div class="p-4 rounded-xl border border-emerald-800 bg-emerald-950/25 text-xs text-gray-200 space-y-2">
            <p class="font-bold text-emerald-300">Đáp án / lời giải trong hệ thống</p>
            <p class="whitespace-pre-wrap leading-5">${escapeHtml(question.answer || (hasChoices ? optionText(question.options[question.correctIndex]) : 'Chưa có đáp án mẫu.'))}</p>
          </div>
        ` : ''}
        ${this.practiceExamReveal && !hasChoices && !this.practiceExamAnswered ? `
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-xs text-gray-400">So với đáp án, bạn tự đánh giá:</span>
            <button data-action="learning.gradePracticeExamAnswer" data-action-args="${encodeActionArgs(false)}" class="px-4 py-2 rounded-xl bg-red-900/60 border border-red-700 text-red-200 text-xs font-bold">Cần ôn lại</button>
            <button data-action="learning.gradePracticeExamAnswer" data-action-args="${encodeActionArgs(true)}" class="px-4 py-2 rounded-xl bg-emerald-900/60 border border-emerald-700 text-emerald-200 text-xs font-bold">Đã trả lời đúng</button>
          </div>
        ` : ''}
        ${this.practiceExamAnswered ? `<div class="flex justify-end"><button data-action="learning.nextPracticeExamQuestion" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold text-white">${current === total ? 'Nộp bài' : 'Câu tiếp theo →'}</button></div>` : ''}
      </div>
    `;
  },

  answerPracticeExamChoice(index) {
    if (this.practiceExamAnswered) return;
    const question = this.practiceExamQuestions[this.practiceExamIndex];
    const isCorrect = Number(index) === question.correctIndex;
    this.practiceExamAttempts[this.practiceExamIndex] = {
      item_id: question.id,
      is_correct: isCorrect,
      selectedIndex: Number(index),
      answer: optionText(question.options[index]),
    };
    this.practiceExamAnswered = true;
    this.renderPracticeExamQuestion();
  },

  revealPracticeExamAnswer() {
    this.practiceExamDraft = document.getElementById('practice-exam-answer')?.value?.trim() || '';
    if (!this.practiceExamDraft) {
      alert('Hãy nhập câu trả lời trước khi xem đáp án.');
      return;
    }
    this.practiceExamReveal = true;
    this.renderPracticeExamQuestion();
  },

  gradePracticeExamAnswer(isCorrect) {
    if (this.practiceExamAnswered) return;
    const question = this.practiceExamQuestions[this.practiceExamIndex];
    this.practiceExamAttempts[this.practiceExamIndex] = {
      item_id: question.id,
      is_correct: Boolean(isCorrect),
      answer: this.practiceExamDraft,
    };
    this.practiceExamAnswered = true;
    this.renderPracticeExamQuestion();
  },

  nextPracticeExamQuestion() {
    this.practiceExamIndex += 1;
    this.practiceExamAnswered = false;
    this.practiceExamReveal = false;
    this.practiceExamDraft = '';
    this.renderPracticeExamQuestion();
  },

  async finishPracticeExam() {
    const container = this.practiceExamContainer();
    if (!container) return;
    const attempts = this.practiceExamAttempts.filter(Boolean);
    const score = attempts.filter((attempt) => attempt.is_correct).length;
    const total = this.practiceExamQuestions.length;
    container.innerHTML = '<div class="p-10 text-center text-sm text-gray-300">⏳ Đang lưu kết quả và lịch sử câu sai...</div>';
    let response;
    try {
      response = await submitPracticeExam(attempts);
    } catch (error) {
      response = { ok: false, error: error.message };
    }
    const saved = response?.ok;
    const pct = total ? Math.round((score / total) * 100) : 0;
    container.innerHTML = `
      <div class="max-w-3xl mx-auto bg-gray-800/90 rounded-2xl border border-gray-700/80 shadow-xl p-7 space-y-6 text-center">
        <div class="text-5xl">${pct >= 80 ? '🏆' : (pct >= 50 ? '👍' : '💪')}</div>
        <div><h2 class="text-2xl font-black text-white">Hoàn thành bài thi</h2><p class="text-xs mt-1 ${saved ? 'text-emerald-400' : 'text-amber-400'}">${saved ? `Đã lưu ${Number(response.recorded) || attempts.length} lượt trả lời vào lịch sử thích ứng.` : 'Chưa lưu được lịch sử, vui lòng thử lại.'}</p></div>
        <div class="grid grid-cols-3 gap-3">
          <div class="p-4 rounded-xl bg-gray-900"><b class="block text-2xl text-white">${score}/${total}</b><span class="text-[11px] text-gray-400">Điểm</span></div>
          <div class="p-4 rounded-xl bg-gray-900"><b class="block text-2xl text-emerald-400">${pct}%</b><span class="text-[11px] text-gray-400">Tỷ lệ đúng</span></div>
          <div class="p-4 rounded-xl bg-gray-900"><b class="block text-2xl text-red-400">${total - score}</b><span class="text-[11px] text-gray-400">Cần ôn lại</span></div>
        </div>
        <div class="text-left max-h-72 overflow-y-auto space-y-2">
          ${this.practiceExamQuestions.map((question, index) => {
            const attempt = this.practiceExamAttempts[index];
            return `<div class="p-3 rounded-xl border ${attempt?.is_correct ? 'border-emerald-900 bg-emerald-950/20' : 'border-red-900 bg-red-950/20'}"><span class="text-xs font-bold ${attempt?.is_correct ? 'text-emerald-300' : 'text-red-300'}">${attempt?.is_correct ? '✓' : '✗'} Câu ${index + 1}</span><p class="text-xs text-gray-300 mt-1">${escapeHtml(question.title)}</p></div>`;
          }).join('')}
        </div>
        <button data-action="learning.loadPracticeExam" data-action-args="${encodeActionArgs(this.practiceExamCategory)}" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white">Làm đề mới</button>
      </div>
    `;
  },
};
