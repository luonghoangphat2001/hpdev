'use strict';

/**
 * Controller for Tech Learning endpoints.
 */
class TechController {
  /** @type {import('../models/TechRepository')} */
  #techRepo;
  /** @type {import('../services/TechService')} */
  #techService;

  /**
   * @param {import('../models/TechRepository')} techRepo
   * @param {import('../services/TechService')} techService
   */
  constructor(techRepo, techService) {
    this.#techRepo = techRepo;
    this.#techService = techService;

    this.getStacks = this.getStacks.bind(this);
    this.getTopics = this.getTopics.bind(this);
    this.getQuestions = this.getQuestions.bind(this);
    this.getQuestionDetail = this.getQuestionDetail.bind(this);
    this.createQuestion = this.createQuestion.bind(this);
    this.updateQuestion = this.updateQuestion.bind(this);
    this.deleteQuestion = this.deleteQuestion.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.generateAIQuestion = this.generateAIQuestion.bind(this);
    this.batchGenerateAIQuestions = this.batchGenerateAIQuestions.bind(this);
    this.mockInterviewAI = this.mockInterviewAI.bind(this);
    this.importQuestions = this.importQuestions.bind(this);
    this.exportQuestions = this.exportQuestions.bind(this);
  }

  /**
   * Get all tech stacks with counters.
   */
  async getStacks(req, res) {
    try {
      const userId = req.session?.userId || null;
      const stacks = await this.#techRepo.findStacks(userId);
      res.json({ ok: true, stacks });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  /**
   * Get sub-topics for a specific stack.
   */
  async getTopics(req, res) {
    try {
      const stackId = Number(req.params.stackId);
      if (!stackId) return res.status(400).json({ ok: false, error: 'Invalid stackId' });
      const topics = await this.#techRepo.findTopics(stackId);
      res.json({ ok: true, topics });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  /**
   * Get filtered questions list with pagination and user progress.
   */
  async getQuestions(req, res) {
    try {
      const userId = req.session?.userId || null;
      const opts = {
        stackSlug: req.query.stack || 'php',
        topicId: req.query.topic_id ? Number(req.query.topic_id) : undefined,
        level: req.query.level || 'all',
        status: req.query.status || 'all',
        isBookmarked: req.query.bookmarked === '1',
        search: req.query.search ? String(req.query.search) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 50,
        offset: req.query.offset ? Number(req.query.offset) : 0,
        userId,
        includeInactive: req.query.include_inactive === '1',
      };

      const [questions, total] = await Promise.all([
        this.#techRepo.findQuestions(opts),
        this.#techRepo.countQuestions(opts),
      ]);

      res.json({ ok: true, questions, total, limit: opts.limit, offset: opts.offset });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  /**
   * Get detail of a single question.
   */
  async getQuestionDetail(req, res) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ ok: false, error: 'Invalid question id' });

      const userId = req.session?.userId || null;
      const question = await this.#techRepo.findQuestionById(id, userId);
      if (!question) return res.status(404).json({ ok: false, error: 'Question not found' });

      res.json({ ok: true, question });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  /**
   * Create question (Admin).
   */
  async createQuestion(req, res) {
    try {
      const body = req.body;
      if (!body.stackId || !body.title || !body.quickAnswer) {
        return res.status(400).json({ ok: false, error: 'stackId, title, and quickAnswer are required' });
      }

      let topicId = body.topicId ? Number(body.topicId) : null;
      if (!topicId && body.topicName) {
        const topic = await this.#techRepo.findOrCreateTopic(Number(body.stackId), body.topicName);
        topicId = topic.id;
      }

      const id = await this.#techRepo.createQuestion({
        stackId: Number(body.stackId),
        topicId,
        title: body.title.trim(),
        question: body.question ? body.question.trim() : body.title.trim(),
        quickAnswer: body.quickAnswer.trim(),
        detailedAnswer: body.detailedAnswer ? body.detailedAnswer.trim() : body.quickAnswer.trim(),
        codeExample: body.codeExample ? body.codeExample.trim() : null,
        interviewTips: body.interviewTips ? body.interviewTips.trim() : null,
        practicalTips: body.practicalTips ? body.practicalTips.trim() : null,
        level: body.level || 'junior',
        tags: body.tags ? body.tags.trim() : null,
        createdBy: req.session?.username || 'admin',
        sortOrder: Number(body.sortOrder || 0),
      });

      res.json({ ok: true, id });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  /**
   * Update question (Admin).
   */
  async updateQuestion(req, res) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ ok: false, error: 'Invalid question id' });

      const ok = await this.#techRepo.updateQuestion(id, req.body);
      res.json({ ok });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  /**
   * Delete question (Admin).
   */
  async deleteQuestion(req, res) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ ok: false, error: 'Invalid question id' });

      const ok = await this.#techRepo.deleteQuestion(id);
      res.json({ ok });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  /**
   * Update user study progress (status, bookmark, notes).
   */
  async updateProgress(req, res) {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

      const questionId = Number(req.params.id);
      if (!questionId) return res.status(400).json({ ok: false, error: 'Invalid question id' });

      const ok = await this.#techRepo.upsertUserProgress(userId, questionId, {
        status: req.body.status,
        isBookmarked: req.body.is_bookmarked,
        personalNotes: req.body.personal_notes,
      });

      res.json({ ok });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  /**
   * AI Generate single question on-demand.
   */
  async generateAIQuestion(req, res) {
    try {
      const { stackSlug, level, topicName, customPrompt, model } = req.body;
      if (!stackSlug) return res.status(400).json({ ok: false, error: 'stackSlug is required' });

      const result = await this.#techService.generateQuestionWithAI({
        stackSlug,
        level,
        topicName,
        customPrompt,
        model,
      });

      res.json({ ok: true, question: result });
    } catch (err) {
      console.error('[TechController] generateAIQuestion error:', err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  /**
   * AI Batch generate questions.
   */
  async batchGenerateAIQuestions(req, res) {
    try {
      const { stackSlug, level, topicName, count, model } = req.body;
      if (!stackSlug) return res.status(400).json({ ok: false, error: 'stackSlug is required' });

      const questions = await this.#techService.batchGenerateWithAI({
        stackSlug,
        level,
        topicName,
        count: Number(count || 3),
        model,
      });

      res.json({ ok: true, questions });
    } catch (err) {
      console.error('[TechController] batchGenerateAIQuestions error:', err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  /**
   * AI Mock Interview evaluation.
   */
  async mockInterviewAI(req, res) {
    try {
      const { questionId, userAnswer, model } = req.body;
      if (!questionId || !userAnswer?.trim()) {
        return res.status(400).json({ ok: false, error: 'questionId and userAnswer are required' });
      }

      const evaluation = await this.#techService.evaluateMockInterview({
        questionId: Number(questionId),
        userAnswer: userAnswer.trim(),
        model,
      });

      res.json({ ok: true, evaluation });
    } catch (err) {
      console.error('[TechController] mockInterviewAI error:', err);
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  /**
   * Import questions from Excel.
   */
  async importQuestions(req, res) {
    try {
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ ok: false, error: 'No Excel file uploaded' });
      }

      const defaultStack = req.body.default_stack || 'php';
      const result = await this.#techService.importQuestionsFromExcel(req.file.buffer, defaultStack);
      res.json(result);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  /**
   * Export questions to Excel.
   */
  async exportQuestions(req, res) {
    try {
      const stack = req.query.stack || null;
      const buffer = await this.#techService.exportQuestionsToExcel(stack);
      const filename = `tech-questions-${stack || 'all'}-${new Date().toISOString().slice(0, 10)}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }
}

module.exports = TechController;
