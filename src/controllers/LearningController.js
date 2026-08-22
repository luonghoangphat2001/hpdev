'use strict';

const { buildPracticeExam } = require('../services/learning/PracticeExamBuilder');
const { performanceMap } = require('../services/learning/AdaptiveSelector');

/**
 * Controller for unified Learning Hub API (Tech & English).
 */
class LearningController {
  /** @type {import('../models/LearningRepository')} */
  #learningRepo;
  /** @type {import('../services/LearningService')} */
  #learningService;

  /**
   * @param {import('../models/LearningRepository')} learningRepo
   * @param {import('../services/LearningService')} learningService
   */
  constructor(learningRepo, learningService) {
    this.#learningRepo = learningRepo;
    this.#learningService = learningService;

    this.categories = this.categories.bind(this);
    this.learnings = this.learnings.bind(this);
    this.learningDetail = this.learningDetail.bind(this);
    this.updateTopic = this.updateTopic.bind(this);
    this.items = this.items.bind(this);
    this.itemDetail = this.itemDetail.bind(this);
    this.createItem = this.createItem.bind(this);
    this.updateItem = this.updateItem.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.generateAI = this.generateAI.bind(this);
    this.saveAIBatch = this.saveAIBatch.bind(this);
    this.evaluateAI = this.evaluateAI.bind(this);
    this.buildQuiz = this.buildQuiz.bind(this);
    this.buildPracticeExam = this.buildPracticeExam.bind(this);
    this.submitPracticeExam = this.submitPracticeExam.bind(this);
    this.submitQuiz = this.submitQuiz.bind(this);
    this.getLeaderboard = this.getLeaderboard.bind(this);
    this.fillPronunciations = this.fillPronunciations.bind(this);
    this.getConfig = this.getConfig.bind(this);
    this.updateConfig = this.updateConfig.bind(this);
    this.sendDiscord = this.sendDiscord.bind(this);
    this.exportExcel = this.exportExcel.bind(this);
    this.importExcel = this.importExcel.bind(this);
  }

  // ─── Categories & Learnings ──────────────────────────────────
  async categories(_req, res) {
    const categories = await this.#learningRepo.findCategories();
    res.json({ ok: true, categories });
  }

  async learnings(req, res) {
    const category = req.query.category || 'tech';
    const type = req.query.type || null;
    const learnings = await this.#learningRepo.findLearnings(category, type);
    res.json({ ok: true, learnings });
  }

  async learningDetail(req, res) {
    const slug = req.params.slug;
    const learning = await this.#learningRepo.findLearningBySlug(slug);
    if (!learning) return res.status(404).json({ ok: false, error: 'Learning topic not found' });
    res.json({ ok: true, learning });
  }

  async updateTopic(req, res) {
    try {
      const id = Number(req.params.id);
      const ok = await this.#learningRepo.updateLearning(id, req.body);
      res.json({ ok });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ─── Items CRUD ──────────────────────────────────────────────
  async items(req, res) {
    const username = req.session?.username || '';
    const filters = {
      categorySlug: req.query.category,
      learningSlug: req.query.learning,
      learningId: req.query.learning_id,
      type: req.query.type,
      topicNo: req.query.topic_no,
      level: req.query.level,
      search: req.query.search,
      isBookmarked: req.query.bookmarked === '1' || req.query.bookmarked === 'true',
      status: req.query.status,
      includeInactive: req.query.include_inactive === '1',
      limit: req.query.limit || 100,
      offset: req.query.offset || 0,
      username,
    };

    const items = await this.#learningRepo.findItems(filters);
    res.json({ ok: true, items });
  }

  async itemDetail(req, res) {
    const id = Number(req.params.id);
    const username = req.session?.username || '';
    const item = await this.#learningRepo.findItemById(id, username);
    if (!item) return res.status(404).json({ ok: false, error: 'Item not found' });
    res.json({ ok: true, item });
  }

  async createItem(req, res) {
    try {
      const { learning_id, type, title, prompt, level, content, sample_solution, tags } = req.body;
      if (!learning_id || !title) {
        return res.status(400).json({ ok: false, error: 'Missing learning_id or title' });
      }

      const id = await this.#learningRepo.createItem({
        learningId: Number(learning_id),
        type: type || 'vocabulary',
        title,
        prompt,
        level,
        content,
        sampleSolution: sample_solution,
        tags,
        createdBy: req.session?.username || 'admin',
      });

      res.json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  async updateItem(req, res) {
    try {
      const id = Number(req.params.id);
      const ok = await this.#learningRepo.updateItem(id, req.body);
      res.json({ ok });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  async deleteItem(req, res) {
    try {
      const id = Number(req.params.id);
      const ok = await this.#learningRepo.deleteItem(id);
      res.json({ ok });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ─── Progress & Bookmark ─────────────────────────────────────
  async updateProgress(req, res) {
    try {
      const id = Number(req.params.id);
      const username = req.session?.username;
      if (!username) return res.status(401).json({ ok: false, error: 'Unauthorized' });

      await this.#learningRepo.upsertMetadata(id, username, {
        status: req.body.status,
        isBookmarked: req.body.is_bookmarked,
        score: req.body.score,
        userSubmission: req.body.user_submission,
        aiFeedback: req.body.ai_feedback,
      });

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ─── AI Generator & Evaluator ────────────────────────────────
  async generateAI(req, res) {
    try {
      const { category, type, learning, topic_no, level, prompt, count, model } = req.body;
      const result = await this.#learningService.generateAIContent({
        categorySlug: category,
        type: type || 'vocabulary',
        learningSlug: learning,
        topicNo: topic_no ? Number(topic_no) : undefined,
        level,
        customPrompt: prompt,
        count: count ? Number(count) : 1,
        model,
      });

      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  async saveAIBatch(req, res) {
    try {
      const { learning_id, type, items } = req.body;
      if (!learning_id || !Array.isArray(items) || !items.length) {
        return res.status(400).json({ ok: false, error: 'Invalid learning_id or items array' });
      }

      const result = await this.#learningService.saveAIBatch({ learningId: learning_id, type, items });
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  async evaluateAI(req, res) {
    try {
      const itemId = req.body.itemId || req.body.item_id;
      const userSubmission = req.body.userSubmission || req.body.user_submission || req.body.submission;
      const type = req.body.type || 'tech_question';
      const model = req.body.model;
      const username = req.session?.username || 'guest';

      if (!itemId || !userSubmission) {
        return res.status(400).json({ ok: false, error: 'Missing item_id or user_submission' });
      }

      const result = await this.#learningService.evaluateAISubmission({
        itemId: Number(itemId),
        username,
        type,
        userSubmission,
        model,
      });

      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ─── Quiz Practice & Leaderboard ─────────────────────────────
  async buildPracticeExam(req, res) {
    try {
      const parseList = (value) => String(value || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
      const count = Math.min(Math.max(Number(req.query.count) || 50, 1), 50);
      const pool = await this.#learningRepo.findPracticeExamPool({
        categorySlug: req.query.category || undefined,
        level: req.query.level || undefined,
        learningSlugs: parseList(req.query.learnings || req.query.learning),
        types: parseList(req.query.types || req.query.type),
      });
      const userId = req.session?.userId ? String(req.session.userId) : (req.session?.username || 'guest');
      const history = typeof this.#learningRepo.getItemPerformance === 'function'
        ? await this.#learningRepo.getItemPerformance(userId, pool.map((item) => item.id))
        : [];
      const questions = buildPracticeExam(pool, count, Math.random, performanceMap(history));
      const levels = questions.reduce((summary, question) => {
        summary[question.difficulty] += 1;
        return summary;
      }, { hard: 0, medium: 0, easy: 0 });

      res.json({ ok: true, total: questions.length, levels, questions });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  async submitPracticeExam(req, res) {
    try {
      const username = req.session?.username || 'guest';
      const userId = req.session?.userId ? String(req.session.userId) : username;
      const recorded = await this.#learningService.recordPracticeExamAttempts(
        userId,
        username,
        req.body.attempts || req.body.details?.attempts || []
      );
      res.json({ ok: true, recorded });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  async buildQuiz(req, res) {
    try {
      const { topic_no, count, mode, level } = req.query;
      const quiz = await this.#learningService.buildQuizFromVocab({
        topicNo: topic_no ? Number(topic_no) : undefined,
        count: count ? Number(count) : 5,
        mode: mode || 'multiple_choice',
        level: level || undefined,
        userId: req.session?.userId ? String(req.session.userId) : (req.session?.username || 'guest'),
      });
      res.json({ ok: true, ...quiz });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  async submitQuiz(req, res) {
    try {
      const username = req.session?.username || 'guest';
      const { score, total, details } = req.body;
      const userId = req.session?.userId ? String(req.session.userId) : username;
      const result = await this.#learningService.recordQuizScore(username, score, total, details, userId);
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  async getLeaderboard(req, res) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const leaderboard = await this.#learningRepo.getLeaderboard(limit);
      res.json({ ok: true, leaderboard });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ─── Auto IPA Pronunciations ─────────────────────────────────
  async fillPronunciations(_req, res) {
    try {
      const result = await this.#learningService.fillMissingPronunciations();
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  // ─── Discord Notifications Config & Instant Send ─────────────
  getConfig(_req, res) {
    res.json({ ok: true, config: this.#learningService.getConfig() });
  }

  async updateConfig(req, res) {
    await this.#learningService.updateConfig(req.body);
    res.json({ ok: true, config: this.#learningService.getConfig() });
  }

  async sendDiscord(req, res) {
    try {
      const id = Number(req.params.id);
      const result = await this.#learningService.sendSingleItemToDiscord(id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  // ─── Excel Import / Export ───────────────────────────────────
  async exportExcel(req, res) {
    try {
      const slug = req.params.slug;
      const buffer = await this.#learningService.exportToExcel(slug);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="learning_${slug || 'all'}.xlsx"`);
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  async importExcel(req, res) {
    try {
      const id = Number(req.params.id);
      let buffer = null;
      if (req.file?.buffer) {
        buffer = req.file.buffer;
      } else if (req.body?.fileBase64) {
        buffer = Buffer.from(req.body.fileBase64, 'base64');
      }

      if (!buffer) {
        return res.status(400).json({ ok: false, error: 'Chưa đính kèm file Excel' });
      }

      const result = await this.#learningService.importFromExcel(id, buffer);
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }
}

module.exports = LearningController;
