'use strict';

/**
 * Controller for Web MPA Page Views.
 * Handles rendering HTML pages with active states, titles, and session context.
 */
class WebController {
  constructor() {
    this.chat = this.chat.bind(this);
    this.learning = this.learning.bind(this);
    this.tech = this.tech.bind(this);
    this.vocabulary = this.vocabulary.bind(this);
    this.quiz = this.quiz.bind(this);
    this.study = this.study.bind(this);
    this.history = this.history.bind(this);
    this.stats = this.stats.bind(this);
    this.users = this.users.bind(this);
    this.openclaw = this.openclaw.bind(this);
    this.logs = this.logs.bind(this);
    this.config = this.config.bind(this);
  }

  /**
   * Helper to render an authenticated MPA page.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {string} pageName
   * @param {string} title
   */
  #renderPage(req, res, pageName, title) {
    res.setHeader('Cache-Control', 'no-store');
    return res.render(`pages/${pageName}`, {
      title,
      activePage: pageName,
      user: req.session?.username || 'User',
      role: req.session?.role || 'user',
    });
  }

  chat(req, res) {
    return this.#renderPage(req, res, 'chat', 'Trò chuyện AI');
  }

  learning(req, res) {
    return this.#renderPage(req, res, 'learning', 'Learning Hub');
  }

  tech(req, res) {
    return this.#renderPage(req, res, 'tech', 'Tech Interview');
  }

  vocabulary(req, res) {
    return this.#renderPage(req, res, 'vocabulary', 'Từ vựng Tiếng Anh');
  }

  quiz(req, res) {
    return this.#renderPage(req, res, 'quiz', 'Luyện tập Quiz');
  }

  study(req, res) {
    return this.#renderPage(req, res, 'study', 'Lịch học & Nhắc nhở');
  }

  history(req, res) {
    return this.#renderPage(req, res, 'history', 'Lịch sử Hội thoại');
  }

  stats(req, res) {
    return this.#renderPage(req, res, 'stats', 'Thống kê Model');
  }

  users(req, res) {
    return this.#renderPage(req, res, 'users', 'Quản lý Người dùng');
  }

  openclaw(req, res) {
    return this.#renderPage(req, res, 'openclaw', 'OpenClaw Monitor');
  }

  logs(req, res) {
    return this.#renderPage(req, res, 'logs', 'Logs Hệ thống');
  }

  config(req, res) {
    return this.#renderPage(req, res, 'config', 'Cấu hình Hệ thống');
  }
}

module.exports = WebController;
