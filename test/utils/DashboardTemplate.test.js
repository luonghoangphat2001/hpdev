'use strict';

const path = require('path');
const DashboardTemplate = require('../../src/utils/DashboardTemplate');

describe('DashboardTemplate Modular Views Assembly & Express Engine', () => {
  beforeEach(() => {
    DashboardTemplate.clearCache();
  });

  test('renders individual MPA page views wrapped in master layout', () => {
    const chatHtml = DashboardTemplate.renderPage('chat');
    expect(chatHtml).toContain('<!DOCTYPE html>');
    expect(chatHtml).toContain('<title>Trò chuyện AI — Đần AI</title>');
    expect(chatHtml).toContain('id="nav-chat"');
    expect(chatHtml).toContain('id="page-chat"');

    const learningHtml = DashboardTemplate.renderPage('learning');
    expect(learningHtml).toContain('<!DOCTYPE html>');
    expect(learningHtml).toContain('id="page-learning"');
    expect(learningHtml).toContain('id="learning-ai-generator-modal"');
    expect(learningHtml).toContain('id="learning-evaluator-modal"');
    expect(learningHtml).toContain('id="tech-view-exam-btn"');
    expect(learningHtml).toContain('data-action-args=\'["split"]\' id="tech-view-split-btn"');
    expect((learningHtml.match(/data-action="learning\.openMockInterviewModal"/g) || [])).toHaveLength(1);
    expect(learningHtml).toContain('id="tech-practice-exam"');
    expect(learningHtml).toContain('id="tech-question-bank-modal"');
    expect(learningHtml).toContain('id="tech-detail-actions"');
    expect(learningHtml).toContain('id="tech-tools-panel"');
    expect(learningHtml).toContain('id="english-tools-panel"');
    expect(learningHtml).toContain('id="sidebar-collapse-btn"');
    expect(learningHtml).toContain('id="sidebar-learning-menu"');
    expect(learningHtml).toContain('id="subtab-btn-exam"');
    expect(learningHtml).toContain('english-tabs-scroll');
    expect(learningHtml).toContain('id="english-practice-exam"');
    expect(learningHtml).toContain('id="quiz-container"');
    expect(learningHtml).toContain('id="vocab-words-scroll"');
    expect(learningHtml).toContain('id="speaking-workspace" class="flex-1 min-h-0 overflow-y-auto');
    expect(learningHtml).toContain('id="ielts-workspace" class="flex-1 min-h-0 overflow-y-auto');

    const configHtml = DashboardTemplate.renderPage('config');
    expect(configHtml).toContain('<!DOCTYPE html>');
    expect(configHtml).toContain('id="page-config"');
    expect(configHtml).toContain('id="gemini-model"');
    expect(configHtml).toContain('id="sidebar-config-menu"');
    expect(configHtml).toContain('data-config-sidebar-tab="providers"');

    const usersHtml = DashboardTemplate.renderPage('users');
    expect(usersHtml).toContain('<!DOCTYPE html>');
    expect(usersHtml).toContain('id="page-users"');
    expect(usersHtml).toContain('id="user-list"');
  });

  test('injects version and active navigation highlights correctly', () => {
    const html = DashboardTemplate.renderPage('learning');
    expect(html).toContain(`v=${DashboardTemplate.version}`);
    expect(html).toContain(`v${DashboardTemplate.version}`);
    expect(html).not.toContain('{{VERSION}}');
    expect(html).not.toContain('{{NAV_ACTIVE_LEARNING}}');
    expect(html).toContain('bg-gray-700 text-white font-semibold shadow-sm');
  });

  test('caches assembled template when cache is enabled', () => {
    DashboardTemplate.clearCache();
    const first = DashboardTemplate.render(false);
    expect(DashboardTemplate.isCached()).toBe(true);

    const second = DashboardTemplate.render(false);
    expect(first).toBe(second);
  });

  test('functions as an Express view engine callback', (done) => {
    const filePath = path.join(__dirname, '../../views/pages/login.html');
    DashboardTemplate.engine(filePath, { cache: false }, (err, html) => {
      expect(err).toBeNull();
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('Xin chào! Tôi là Đần');
      expect(html).toContain(`v${DashboardTemplate.version}`);
      expect(html).not.toContain('{{VERSION}}');
      done();
    });
  });
});
