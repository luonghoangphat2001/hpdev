'use strict';

const fs = require('fs');
const path = require('path');

const pkg = require('../../package.json');
const VERSION = pkg.version || '2.0.0';

const VIEWS_DIR = path.join(__dirname, '../../views');
const LAYOUTS_DIR = path.join(VIEWS_DIR, 'layouts');
const PAGES_DIR = path.join(VIEWS_DIR, 'pages');
const MAIN_LAYOUT = path.join(LAYOUTS_DIR, 'main.html');

const NAV_ITEMS = [
  'chat',
  'learning',
  'schedule',
  'config',
  'history',
  'stats',
  'users',
  'openclaw',
  'logs',
  'tech',
  'vocabulary',
  'quiz',
];

const PAGE_TITLES = {
  chat: 'Trò chuyện AI',
  learning: 'Learning Hub',
  tech: 'Tech Interview',
  vocabulary: 'Từ vựng',
  quiz: 'Luyện tập Quiz',
  schedule: 'Lịch học & Nhắc nhở',
  study: 'Lịch học & Nhắc nhở',
  config: 'Cấu hình Hệ thống',
  history: 'Lịch sử Hội thoại',
  stats: 'Thống kê Model',
  users: 'Quản lý Tài khoản',
  openclaw: 'OpenClaw Monitor',
  logs: 'Logs Hệ thống',
  login: 'Đăng nhập',
};

class DashboardTemplate {
  static #cache = new Map();

  /**
   * Application version from package.json
   */
  static get version() {
    return VERSION;
  }

  /**
   * Express View Engine interface: (filePath, options, callback)
   * Registered via app.engine('html', DashboardTemplate.engine)
   *
   * @param {string} filePath
   * @param {object} options
   * @param {Function} callback
   */
  static engine(filePath, options, callback) {
    try {
      const rendered = DashboardTemplate.renderFile(filePath, options);
      return callback(null, rendered);
    } catch (err) {
      return callback(err);
    }
  }

  /**
   * Reads a partial file safely with fallback. Supports nested includes.
   * @param {string} relativePath
   * @returns {string}
   */
  static #readPartial(relativePath) {
    const filePath = path.join(VIEWS_DIR, relativePath.trim());
    if (!fs.existsSync(filePath)) {
      console.warn(`[DashboardTemplate] Missing partial: ${filePath}`);
      return `<!-- Missing partial: ${relativePath} -->`;
    }

    let content = fs.readFileSync(filePath, 'utf8').trim();
    if (content.includes('include:')) {
      content = content.replace(/<!--\s*include:\s*([^\s>]+)\s*-->/g, (_match, nestedPath) => {
        return this.#readPartial(nestedPath);
      });
    }

    return content;
  }

  /**
   * Render any view file with layout wrapper, variable injection and partial includes.
   *
   * @param {string} filePath
   * @param {object} [locals={}]
   * @returns {string}
   */
  static renderFile(filePath, locals = {}) {
    const isProd = process.env.NODE_ENV === 'production' || locals.cache === true;
    const cacheKey = `${filePath}:${JSON.stringify(locals.activePage || '')}`;

    if (isProd && this.#cache.has(cacheKey)) {
      return this.#cache.get(cacheKey);
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`View file not found: ${filePath}`);
    }

    const baseName = path.basename(filePath, '.html');
    const isLoginPage = baseName === 'login';
    const activePage = locals.activePage || (baseName !== 'main' ? baseName : 'chat');

    let pageContent = fs.readFileSync(filePath, 'utf8');

    // 1. Resolve partial includes inside the page content
    pageContent = pageContent.replace(/<!--\s*include:\s*([^\s>]+)\s*-->/g, (_match, partialPath) => {
      return this.#readPartial(partialPath);
    });

    let fullHtml = '';

    // 2. Wrap in main layout if not login and not already a layout
    if (!isLoginPage && fs.existsSync(MAIN_LAYOUT) && !filePath.includes('layouts/main.html')) {
      let layout = fs.readFileSync(MAIN_LAYOUT, 'utf8');

      // Resolve includes in layout (e.g. sidebar)
      layout = layout.replace(/<!--\s*include:\s*([^\s>]+)\s*-->/g, (_match, partialPath) => {
        return this.#readPartial(partialPath);
      });

      fullHtml = layout.replace('{{BODY}}', pageContent);
    } else {
      fullHtml = pageContent;
    }

    // 3. Setup Navigation active states for sidebar
    const navVars = {};
    for (const item of NAV_ITEMS) {
      const isItemActive = (item === activePage)
        || (item === 'schedule' && activePage === 'study')
        || (item === 'learning' && ['tech', 'vocabulary', 'quiz'].includes(activePage));

      navVars[`NAV_ACTIVE_${item.toUpperCase()}`] = isItemActive
        ? 'bg-gray-700 text-white font-semibold shadow-sm'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white';
    }

    // 4. Setup page variables & session info
    const pageTitle = locals.title || PAGE_TITLES[activePage] || 'Dashboard';
    const username = locals.user || locals.username || 'Admin';
    const role = locals.role || 'user';
    const userInitial = (username.charAt(0) || 'U').toUpperCase();

    const vars = {
      VERSION,
      PAGE_TITLE: pageTitle,
      ACTIVE_PAGE: activePage,
      USERNAME: username,
      ROLE: role,
      USER_INITIAL: userInitial,
      PAGE_SCRIPT: '',
      ...navVars,
      ...locals,
    };

    // 5. Replace placeholders: {{KEY}} and {{ KEY }}
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value === 'string' || typeof value === 'number') {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        fullHtml = fullHtml.replace(regex, String(value));
      }
    }

    if (isProd) {
      this.#cache.set(cacheKey, fullHtml);
    }

    return fullHtml;
  }

  /**
   * Render a specific named page.
   * @param {string} pageName
   * @param {object} [options={}]
   * @returns {string}
   */
  static renderPage(pageName, options = {}) {
    const pagePath = path.join(PAGES_DIR, `${pageName}.html`);
    return this.renderFile(pagePath, {
      activePage: pageName,
      ...options,
    });
  }

  /**
   * Compiles default master dashboard page (for backward compatibility and tests).
   * @param {boolean} [forceRefresh=false]
   * @returns {string}
   */
  static render(forceRefresh = false) {
    if (forceRefresh) {
      this.clearCache();
    }
    return this.renderPage('chat', { cache: !forceRefresh });
  }

  /**
   * Clears the in-memory cache.
   */
  static clearCache() {
    this.#cache.clear();
  }

  /**
   * Checks if any view is cached in memory.
   * @returns {boolean}
   */
  static isCached() {
    return this.#cache.size > 0;
  }
}

module.exports = DashboardTemplate;
