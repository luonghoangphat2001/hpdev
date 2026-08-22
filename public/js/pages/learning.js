import { techFeature } from '../features/learning/tech.js';
import { vocabFeature } from '../features/learning/vocab.js';
import { quizFeature } from '../features/learning/quiz.js';
import { readingFeature } from '../features/learning/reading.js';
import { writingFeature } from '../features/learning/writing.js';
import { speakingFeature } from '../features/learning/speaking.js';
import { ieltsFeature } from '../features/learning/ielts.js';
import { practiceExamFeature } from '../features/learning/practice-exam.js';
import { aiGeneratorFeature } from '../features/learning/ai-generator.js';
import { evaluatorFeature } from '../features/learning/evaluator.js';
import { crudFeature } from '../features/learning/crud.js';
import { learningRoutes } from '../app/routes/learning.js';

export const LearningPage = {
  // ─── Shared State ─────────────────────────────────────────────
  activeCategory: 'tech',
  activeEnglishSubTab: 'vocab',
  activeTechSlug: 'php',
  activeTopicNo: 1,
  techViewMode: 'split',
  techBookmarkOnly: false,
  techQuestions: [],
  activeTechQuestion: null,
  flashcardIndex: 0,
  flashcardFlipped: false,
  vocabWords: [],
  aiGeneratedItems: [],
  currentEvaluationItem: null,
  techLoadRequestId: 0,
  pendingTechQuestionId: null,
  pendingEnglishItemId: null,
  restoringUrlState: false,
  eventsBound: false,

  // Quiz state
  quizMode: 'multiple_choice',
  quizQuestions: [],
  currentQuizIndex: 0,
  quizScore: 0,
  quizStreak: 0,
  quizAnswered: false,
  quizAutoAdvanceTimer: null,
  quizCountdownTimer: null,
  quizFinishing: false,

  // Reading Comprehension state
  readingTasks: [],
  activeReadingTask: null,
  showReadingModelAnswer: false,

  // Writing Studio state
  writingTasks: [],
  activeWritingTask: null,
  showWritingModelAnswer: false,

  // Speaking Coach state
  speakingTopics: [],
  activeSpeakingTopic: null,
  showSpeakingSample: false,
  isRecordingSpeaking: false,
  speechRecognitionInstance: null,

  // IELTS Prep state
  ieltsTasks: [],
  activeIeltsTask: null,
  showIeltsSample: false,
  ieltsTimerInterval: null,
  ieltsTimeRemaining: 2400,
  ieltsTimerRunning: false,

  // Database-only practice exam state
  practiceExamCategory: null,
  practiceExamLearnings: [],
  practiceExamQuizTopics: [],
  practiceExamQuestions: [],
  practiceExamIndex: 0,
  practiceExamAttempts: [],
  practiceExamAnswered: false,
  practiceExamLevel: '',
  englishFilterLevel: '',

  // ─── Lifecycle & Global Handlers ──────────────────────────────
  async init() {
    this.restoringUrlState = true;
    this.restoreStateFromUrl();
    this.bindEvents();
    await this.loadTechStacks();
    await this.loadVocabTopics();
    await this.loadNotificationConfig();
    await this.switchCategory(this.activeCategory, { updateUrl: false });
    this.restoringUrlState = false;
    this.syncUrl({ replace: true });
  },

  bindEvents() {
    if (this.eventsBound) return;
    this.eventsBound = true;
    const setupToolsPanel = (elementId, storageKey, defaultOpen, relatedSelector = '') => {
      const panel = document.getElementById(elementId);
      if (!panel) return;
      const summary = panel.querySelector('summary');
      const content = panel.querySelector('.learning-tools-content');
      const contentInner = panel.querySelector('.learning-tools-content-inner');
      const relatedContent = relatedSelector ? document.querySelector(relatedSelector) : null;
      let savedState = null;
      try {
        savedState = globalThis.localStorage?.getItem(storageKey) ?? null;
      } catch (_) {}
      panel.open = savedState === null
        ? defaultOpen
        : savedState === '1';
      let expanded = panel.open;
      let animating = false;
      panel.classList.toggle('tools-expanded', expanded);

      summary?.addEventListener('click', async (event) => {
        event.preventDefault();
        if (animating || !content || !contentInner) return;
        animating = true;
        const opening = !expanded;
        expanded = opening;
        panel.classList.toggle('tools-expanded', opening);

        if (opening) panel.open = true;
        if (typeof content.animate !== 'function') {
          panel.open = opening;
          animating = false;
          try {
            globalThis.localStorage?.setItem(storageKey, opening ? '1' : '0');
          } catch (_) {}
          return;
        }
        const fullHeight = contentInner.scrollHeight;
        const startHeight = opening ? 0 : content.getBoundingClientRect().height;
        const endHeight = opening ? fullHeight : 0;
        const animation = content.animate([
          { height: `${startHeight}px`, opacity: opening ? 0 : 1, transform: opening ? 'translateY(-8px)' : 'translateY(0)' },
          { height: `${endHeight}px`, opacity: opening ? 1 : 0, transform: opening ? 'translateY(0)' : 'translateY(-8px)' },
        ], {
          duration: 900,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'both',
        });
        const relatedIsVisible = relatedContent && relatedContent.getClientRects().length > 0;
        const relatedAnimation = relatedIsVisible
          ? relatedContent.animate([
            {
              height: opening ? '0px' : `${relatedContent.getBoundingClientRect().height}px`,
              opacity: opening ? 0 : 1,
              transform: opening ? 'translateY(-8px)' : 'translateY(0)',
            },
            {
              height: opening ? `${relatedContent.scrollHeight}px` : '0px',
              opacity: opening ? 1 : 0,
              transform: opening ? 'translateY(0)' : 'translateY(-8px)',
            },
          ], {
            duration: 900,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'both',
          })
          : null;

        try {
          await Promise.all([
            animation.finished,
            relatedAnimation?.finished || Promise.resolve(),
          ]);
        } catch (_) {}
        if (!opening) panel.open = false;
        animation.cancel();
        relatedAnimation?.cancel();
        animating = false;
        try {
          globalThis.localStorage?.setItem(storageKey, opening ? '1' : '0');
        } catch (_) {}
      });
    };
    setupToolsPanel('tech-tools-panel', 'dan-tech-tools-open', !this.pendingTechQuestionId);
    setupToolsPanel(
      'english-tools-panel',
      'dan-english-tools-open',
      !this.pendingEnglishItemId,
      '#english-sub-quiz > .quiz-toolbar-scroll',
    );

    const searchInput = document.getElementById('tech-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.loadTechQuestions());
    }

    const levelFilter = document.getElementById('tech-filter-level');
    if (levelFilter) {
      levelFilter.addEventListener('change', () => this.loadTechQuestions());
    }

    const statusFilter = document.getElementById('tech-filter-status');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.loadTechQuestions());
    }

    const modalAiType = document.getElementById('modal-ai-type');
    if (modalAiType) {
      modalAiType.addEventListener('change', () => this.onModalTypeChange());
    }

    // Modal toggle for filter
    const filterModalBtn = document.getElementById('tech-filter-modal-btn');
    if (filterModalBtn) {
      filterModalBtn.addEventListener('click', () => {
        const modal = document.getElementById('tech-filter-modal');
        if (modal) modal.classList.remove('hidden');
      });
    }
    const filterModalClose = document.getElementById('tech-filter-modal-close');
    if (filterModalClose) {
      filterModalClose.addEventListener('click', () => {
        const modal = document.getElementById('tech-filter-modal');
        if (modal) modal.classList.add('hidden');
      });
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') this.closeTechQuestionBank();
      this.handleQuizKeyboardShortcut(event);
      this.handleFlashcardKeyboardShortcut(event);
    });
  },

  restoreStateFromUrl() {
    const route = learningRoutes.parse();
    if (!route) return;

    this.activeCategory = route.section;
    if (route.section === 'tech') {
      this.activeTechSlug = route.stack;
      this.pendingTechQuestionId = route.questionId;
      return;
    }

    this.activeEnglishSubTab = route.tab;
    this.activeTopicNo = route.topicNo;
    this.quizMode = route.quizMode;
    this.pendingEnglishItemId = route.itemId;
  },

  syncUrl({ replace = false } = {}) {
    if (this.restoringUrlState) return;

    const targetPath = learningRoutes.build({
      section: this.activeCategory,
      stack: this.activeTechSlug,
      questionId: this.activeTechQuestion?.id || this.pendingTechQuestionId,
      tab: this.activeEnglishSubTab,
      topicNo: this.activeTopicNo,
      quizMode: this.quizMode,
      itemId: this.getActiveEnglishItemId(),
    });
    if (globalThis.location.pathname === targetPath) return;

    globalThis.history[replace ? 'replaceState' : 'pushState'](null, '', targetPath);
  },

  getActiveEnglishItemId() {
    if (this.activeEnglishSubTab === 'exam') return null;
    if (this.activeEnglishSubTab === 'reading') return this.activeReadingTask?.id;
    if (this.activeEnglishSubTab === 'writing') return this.activeWritingTask?.id;
    if (this.activeEnglishSubTab === 'speaking') return this.activeSpeakingTopic?.id;
    if (this.activeEnglishSubTab === 'ielts') return this.activeIeltsTask?.id;
    return this.pendingEnglishItemId;
  },

  // ─── Category & Sub-Tab Switchers ─────────────────────────────
  async switchCategory(category, { updateUrl = true } = {}) {
    this.activeCategory = category === 'english' ? 'english' : 'tech';
    const isTech = this.activeCategory === 'tech';

    const techSec = document.getElementById('learning-section-tech');
    const engSec = document.getElementById('learning-section-english');
    const techBtn = document.getElementById('tab-btn-tech');
    const engBtn = document.getElementById('tab-btn-english');

    if (isTech) {
      techSec?.classList.remove('hidden');
      engSec?.classList.add('hidden');
      techBtn?.classList.add('bg-indigo-600', 'text-white', 'shadow');
      techBtn?.classList.remove('text-gray-400');
      engBtn?.classList.remove('bg-indigo-600', 'text-white', 'shadow');
      engBtn?.classList.add('text-gray-400');
      await this.loadTechQuestions();
    } else {
      techSec?.classList.add('hidden');
      engSec?.classList.remove('hidden');
      engBtn?.classList.add('bg-indigo-600', 'text-white', 'shadow');
      engBtn?.classList.remove('text-gray-400');
      techBtn?.classList.remove('bg-indigo-600', 'text-white', 'shadow');
      techBtn?.classList.add('text-gray-400');
      await this.switchEnglishSubTab(this.activeEnglishSubTab, { updateUrl: false });
    }

    if (updateUrl) this.syncUrl();
  },

  async switchEnglishSubTab(subTab, { updateUrl = true } = {}) {
    // Map legacy 'rw' to 'reading'
    const targetSubTab = subTab === 'rw' ? 'reading' : subTab;
    if (updateUrl) this.pendingEnglishItemId = null;
    this.activeEnglishSubTab = targetSubTab;
    const tabs = ['vocab', 'quiz', 'exam', 'reading', 'writing', 'speaking', 'ielts'];

    tabs.forEach((t) => {
      const sec = document.getElementById(`english-sub-${t}`);
      const btn = document.getElementById(`subtab-btn-${t}`);
      if (t === targetSubTab) {
        sec?.classList.remove('hidden');
        btn?.classList.add('bg-indigo-600', 'text-white', 'shadow');
        btn?.classList.remove('text-gray-400');
      } else {
        sec?.classList.add('hidden');
        btn?.classList.remove('bg-indigo-600', 'text-white', 'shadow');
        btn?.classList.add('text-gray-400');
      }
    });

    const vocabToolsGrid = document.getElementById('vocab-tools-grid');
    if (vocabToolsGrid) {
      vocabToolsGrid.classList.toggle('hidden', targetSubTab !== 'vocab');
    }

    if (targetSubTab === 'vocab') await this.loadVocabWords();
    if (targetSubTab === 'quiz') await this.loadQuiz();
    if (targetSubTab === 'exam') await this.loadPracticeExam('english');
    if (targetSubTab === 'reading') await this.loadReading();
    if (targetSubTab === 'writing') await this.loadWriting();
    if (targetSubTab === 'speaking') await this.loadSpeaking();
    if (targetSubTab === 'ielts') await this.loadIelts();

    if (updateUrl) this.syncUrl();
  },

  async setEnglishLevelFilter(level) {
    this.englishFilterLevel = level || '';
    await this.switchEnglishSubTab(this.activeEnglishSubTab, { updateUrl: false });
  },

  closeModal(id) {
    document.getElementById(id)?.classList.add('hidden');
  },
};

// ─── Attach Feature Mixins ──────────────────────────────────────
Object.assign(
  LearningPage,
  techFeature,
  vocabFeature,
  quizFeature,
  readingFeature,
  writingFeature,
  speakingFeature,
  ieltsFeature,
  practiceExamFeature,
  aiGeneratorFeature,
  evaluatorFeature,
  crudFeature
);
