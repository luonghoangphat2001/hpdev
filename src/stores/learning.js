import { defineStore } from 'pinia';
import { getLearnings, getLearningItems, toggleBookmark as apiToggleBookmark } from '@/api/learning';

export const useLearningStore = defineStore('learning', {
  state: () => ({
    activeCategory: 'tech', // 'tech' | 'vocab' | 'quiz' | 'reading' | 'writing' | 'speaking' | 'practice'
    techStacks: [],
    activeTechSlug: 'php',
    techQuestions: [],
    activeQuestion: null,
    vocabWords: [],
    searchQuery: '',
    filterLevel: '',
    filterStatus: '',
    filterBookmark: false,
    viewMode: 'split', // 'split' | 'flashcard'
    flashcardIndex: 0,
    flashcardFlipped: false,
    loading: false,
  }),
  actions: {
    async loadTechStacks() {
      try {
        const res = await getLearnings('tech');
        if (res && res.learnings) {
          this.techStacks = res.learnings;
        }
      } catch (err) {
        console.error('Failed to load tech stacks:', err);
      }
    },
    async loadQuestions() {
      this.loading = true;
      try {
        const res = await getLearningItems({
          category: 'tech',
          learning: this.activeTechSlug,
          search: this.searchQuery,
          level: this.filterLevel,
          status: this.filterStatus,
          bookmarked: this.filterBookmark ? 1 : 0,
          limit: 200,
        });
        if (res && res.items) {
          this.techQuestions = res.items;
          const activeId = this.activeQuestion?.id;
          this.activeQuestion = this.techQuestions.find((question) => question.id === activeId)
            || this.techQuestions[0]
            || null;
          this.flashcardIndex = Math.max(0, this.techQuestions.findIndex((question) => question.id === this.activeQuestion?.id));
        }
      } catch (err) {
        console.error('Failed to load questions:', err);
      } finally {
        this.loading = false;
      }
    },
    async toggleBookmark(question) {
      if (!question) return;
      const newStatus = !question.is_bookmarked;
      question.is_bookmarked = newStatus;
      try {
        await apiToggleBookmark(question.id, newStatus);
      } catch (err) {
        question.is_bookmarked = !newStatus;
      }
    },
    selectQuestion(q) {
      this.activeQuestion = q;
    },
    setTechSlug(slug) {
      this.activeTechSlug = slug;
      this.activeQuestion = null;
      this.flashcardIndex = 0;
      this.flashcardFlipped = false;
      this.loadQuestions();
    },
  },
});
