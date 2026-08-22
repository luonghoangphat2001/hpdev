import { RoutePath } from './path.js';

const ENGLISH_TABS = new Set(['vocab', 'quiz', 'exam', 'reading', 'writing', 'speaking', 'ielts']);
const QUIZ_MODES = new Set(['multiple_choice', 'spelling', 'leaderboard']);

export class LearningRoutes {
  parse(pathname = globalThis.location.pathname) {
    const path = new RoutePath(pathname);
    if (!path.isRoot('learning')) return null;
    if (path.segment(1) === 'tech') return this.#parseTech(path);
    if (path.segment(1) === 'english') return this.#parseEnglish(path);
    return { section: 'tech', stack: 'php', questionId: null };
  }

  build(state) {
    return state.section === 'tech'
      ? this.#buildTech(state)
      : this.#buildEnglish(state);
  }

  #parseTech(path) {
    return {
      section: 'tech',
      stack: path.segment(2, 'php'),
      questionId: path.segment(3) === 'question' ? path.number(4) : null,
    };
  }

  #parseEnglish(path) {
    const tab = this.#normalizeEnglishTab(path.segment(2));
    return {
      section: 'english',
      tab,
      topicNo: tab === 'vocab' && path.segment(3) === 'topic' ? path.number(4, 1) : 1,
      quizMode: tab === 'quiz' && path.segment(3) === 'mode'
        ? this.#normalizeQuizMode(path.segment(4))
        : 'multiple_choice',
      itemId: path.segment(3) === 'item' ? path.number(4) : null,
    };
  }

  #buildTech(state) {
    const base = `/learning/tech/${RoutePath.encode(state.stack || 'php')}`;
    return state.questionId ? `${base}/question/${state.questionId}` : base;
  }

  #buildEnglish(state) {
    const tab = this.#normalizeEnglishTab(state.tab);
    const base = `/learning/english/${tab}`;
    if (tab === 'vocab') return `${base}/topic/${Math.max(1, Number(state.topicNo) || 1)}`;
    if (tab === 'quiz') return `${base}/mode/${this.#normalizeQuizMode(state.quizMode)}`;
    return state.itemId ? `${base}/item/${state.itemId}` : base;
  }

  #normalizeEnglishTab(tab) {
    return ENGLISH_TABS.has(tab) ? tab : 'vocab';
  }

  #normalizeQuizMode(mode) {
    return QUIZ_MODES.has(mode) ? mode : 'multiple_choice';
  }
}

export const learningRoutes = new LearningRoutes();
