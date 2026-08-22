'use strict';

const { performanceMap, weightedShuffle } = require('./AdaptiveSelector');

/**
 * QuizEngine: Generates questions for all 5 quiz modes (Multiple Choice, IPA Match, Fill in Blank, Spelling, Flashcards)
 * and processes quiz answers & scoring.
 */
class QuizEngine {
  /** @type {import('../models/VocabularyRepository')} */
  #vocabRepo;
  /** @type {import('../models/QuizRepository')} */
  #quizRepo;

  /**
   * @param {import('../models/VocabularyRepository')} vocabRepo
   * @param {import('../models/QuizRepository')} quizRepo
   */
  constructor(vocabRepo, quizRepo) {
    this.#vocabRepo = vocabRepo;
    this.#quizRepo = quizRepo;
  }

  /**
   * Generate a batch of quiz questions based on requested mode and topic.
   * @param {{ mode?: string, topicNo?: number, limit?: number, userId?: string }} opts
   */
  async generateQuestions(opts = {}) {
    const mode = String(opts.mode || 'multiple_choice').toLowerCase();
    const topicNo = opts.topicNo ? Number(opts.topicNo) : null;
    const limit = Math.min(Math.max(Number(opts.limit || 5), 1), 20);

    const allWords = await this.#vocabRepo.findWords(topicNo, { limit: 500 });
    if (!allWords.length) {
      throw new Error('Chưa có từ vựng trong chủ đề này để tạo Quiz.');
    }

    const userId = String(opts.userId || '').trim();
    const history = userId && typeof this.#quizRepo.getItemPerformance === 'function'
      ? await this.#quizRepo.getItemPerformance(userId, allWords.map((word) => word.id))
      : [];
    const shuffled = weightedShuffle(allWords, performanceMap(history));
    const selected = shuffled.slice(0, limit);

    const questions = selected.map((wordObj, index) => {
      switch (mode) {
        case 'ipa_matching':
          return this.#buildIpaQuestion(wordObj, allWords, index + 1);
        case 'fill_blank':
          return this.#buildFillBlankQuestion(wordObj, allWords, index + 1);
        case 'spelling':
          return this.#buildSpellingQuestion(wordObj, index + 1);
        case 'flashcard':
          return this.#buildFlashcard(wordObj, index + 1);
        case 'multiple_choice':
        default:
          return this.#buildMultipleChoiceQuestion(wordObj, allWords, index + 1);
      }
    });

    return { mode, total: questions.length, questions };
  }

  /**
   * Submit and evaluate a quiz answer.
   * @param {{ userId: string, username: string, wordId: number, quizType: string, answer: string }} payload
   */
  async submitAnswer(payload) {
    const userId = String(payload.userId || 'guest').trim();
    const username = String(payload.username || 'Học viên').trim();
    const wordId = Number(payload.wordId);
    const quizType = String(payload.quizType || 'multiple_choice').toLowerCase();
    const userAns = String(payload.answer || '').trim();

    const words = await this.#vocabRepo.findWords(null, { limit: 1000 });
    const wordRow = words.find((w) => Number(w.id) === wordId);
    if (!wordRow) {
      throw new Error(`Word #${wordId} not found`);
    }

    let isCorrect = false;
    let expected = '';

    if (quizType === 'multiple_choice') {
      expected = wordRow.meaning.trim();
      isCorrect = this.#normalize(userAns) === this.#normalize(expected);
    } else if (quizType === 'ipa_matching' || quizType === 'spelling' || quizType === 'fill_blank') {
      expected = wordRow.word.trim();
      isCorrect = this.#normalize(userAns) === this.#normalize(expected);
    } else if (quizType === 'flashcard') {
      // rating: easy (+10), good (+5), again (+0)
      isCorrect = userAns !== 'again';
      expected = userAns;
    }

    let scoreDelta = 0;
    if (isCorrect) {
      scoreDelta = quizType === 'spelling' ? 15 : (quizType === 'fill_blank' ? 15 : 10);
    }

    const updatedStats = await this.#quizRepo.recordResult({
      userId,
      username,
      wordId,
      quizType,
      isCorrect,
      scoreDelta,
    });

    return {
      wordId,
      isCorrect,
      expected,
      scoreDelta,
      userStats: updatedStats,
      explanation: {
        word: wordRow.word,
        pronunciation: wordRow.pronunciation ? `/${wordRow.pronunciation.replace(/^\/|\/$/g, '')}/` : null,
        meaning: wordRow.meaning,
        example: wordRow.example || null,
        note: wordRow.note || null,
      },
    };
  }

  /**
   * Get leaderboard rankings.
   * @param {number} [limit=10]
   */
  async getLeaderboard(limit = 10) {
    return this.#quizRepo.getLeaderboard(limit);
  }

  // ── Question Builders ─────────────────────────────────────

  #buildMultipleChoiceQuestion(target, pool, num) {
    const distractors = this.#pickDistractors(target, pool, (w) => w.meaning, 3);
    const options = this.#shuffleArray([target.meaning, ...distractors]);

    return {
      id: target.id,
      number: num,
      type: 'multiple_choice',
      prompt: `📖 Nghĩa tiếng Việt của từ này là gì?`,
      word: target.word,
      pronunciation: target.pronunciation ? `/${target.pronunciation.replace(/^\/|\/$/g, '')}/` : null,
      options,
    };
  }

  #buildIpaQuestion(target, pool, num) {
    const pron = target.pronunciation
      ? `/${target.pronunciation.replace(/^\/|\/$/g, '')}/`
      : '/.../';
    const distractors = this.#pickDistractors(target, pool, (w) => w.word, 3);
    const options = this.#shuffleArray([target.word, ...distractors]);

    return {
      id: target.id,
      number: num,
      type: 'ipa_matching',
      prompt: `🎧 Phiên âm chuẩn Mỹ **${pron}** tương ứng với từ tiếng Anh nào?`,
      pronunciation: pron,
      meaningHint: target.meaning,
      options,
    };
  }

  #buildFillBlankQuestion(target, pool, num) {
    let sentence = target.example || `I need to learn how to use ${target.word} correctly.`;
    const regex = new RegExp(target.word, 'gi');
    sentence = sentence.replace(regex, '______');

    const distractors = this.#pickDistractors(target, pool, (w) => w.word, 3);
    const options = this.#shuffleArray([target.word, ...distractors]);

    return {
      id: target.id,
      number: num,
      type: 'fill_blank',
      prompt: `📝 Chọn từ đúng điền vào chỗ trống:`,
      sentence,
      meaning: target.meaning,
      options,
    };
  }

  #buildSpellingQuestion(target, num) {
    const chars = target.word.split('').sort(() => Math.random() - 0.5).join(' - ');
    const pronStr = target.pronunciation ? ` /${target.pronunciation.replace(/^\/|\/$/g, '')}/` : '';

    return {
      id: target.id,
      number: num,
      type: 'spelling',
      prompt: `🔤 Ghép chữ cái thành từ có nghĩa: **"${target.meaning}"**${pronStr}`,
      scrambled: chars,
      meaning: target.meaning,
      wordLength: target.word.length,
    };
  }

  #buildFlashcard(target, num) {
    const pronStr = target.pronunciation ? `/${target.pronunciation.replace(/^\/|\/$/g, '')}/` : '';
    return {
      id: target.id,
      number: num,
      type: 'flashcard',
      front: {
        word: target.word,
        pronunciation: pronStr,
        topicName: target.topic_name || `Chủ đề ${target.topic_no}`,
      },
      back: {
        meaning: target.meaning,
        example: target.example || null,
        note: target.note || null,
      },
    };
  }

  #pickDistractors(target, pool, extractor, count) {
    const set = new Set();
    const candidates = pool.filter((w) => Number(w.id) !== Number(target.id));
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);

    for (const item of shuffled) {
      const val = extractor(item);
      if (val && val !== extractor(target) && !set.has(val)) {
        set.add(val);
      }
      if (set.size >= count) break;
    }

    // Fallbacks if set is too small
    let i = 1;
    while (set.size < count) {
      set.add(`Đáp án lựa chọn ${i++}`);
    }
    return Array.from(set);
  }

  #shuffleArray(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  #normalize(str) {
    return String(str || '').toLowerCase().trim().replace(/\s+/g, ' ');
  }
}

module.exports = QuizEngine;
