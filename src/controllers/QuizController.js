'use strict';

/**
 * Controller for Web Dashboard Quiz endpoints.
 */
class QuizController {
  /** @type {import('../services/QuizEngine')} */
  #quizEngine;

  /** @param {import('../services/QuizEngine')} quizEngine */
  constructor(quizEngine) {
    this.#quizEngine = quizEngine;
    this.generate = this.generate.bind(this);
    this.submit = this.submit.bind(this);
    this.leaderboard = this.leaderboard.bind(this);
    this.history = this.history.bind(this);
  }

  async generate(req, res) {
    try {
      const data = await this.#quizEngine.generateQuestions({
        mode: req.query.mode,
        topicNo: req.query.topic,
        limit: req.query.limit,
        userId: req.session?.userId ? String(req.session.userId) : 'admin_user',
      });
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  async submit(req, res) {
    try {
      const userId = req.session?.userId ? String(req.session.userId) : (req.body.user_id || 'admin_user');
      const username = req.session?.username ? String(req.session.username) : (req.body.username || 'Học viên');
      const result = await this.#quizEngine.submitAnswer({
        userId,
        username,
        wordId: req.body.word_id,
        quizType: req.body.quiz_type,
        answer: req.body.answer,
      });
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  async leaderboard(req, res) {
    try {
      const limit = req.query.limit || 10;
      const rankings = await this.#quizEngine.getLeaderboard(limit);
      res.json({ ok: true, rankings });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  async history(req, res) {
    try {
      const userId = req.session?.userId ? String(req.session.userId) : (req.query.user_id || 'admin_user');
      const limit = Number(req.query.limit || 20);
      const offset = Number(req.query.offset || 0);
      const result = await this.#quizEngine.getUserHistory(userId, { limit, offset });
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }
}

module.exports = QuizController;
