import { registerActionTarget } from './events.js';

const DEFAULT_PAGE_BY_ROLE = {
  admin: 'config',
  user: 'chat',
};

const ADMIN_PAGES = new Set([
  'config',
  'schedule',
  'vocabulary',
  'quiz',
  'tech',
  'history',
  'stats',
  'users',
  'openclaw',
  'logs',
]);

const DASHBOARD_PAGES = new Set([
  'chat',
  'learning',
  ...ADMIN_PAGES,
]);

function normalizePageName(pageName) {
  const normalizedName = String(pageName || '')
    .trim()
    .split('?')[0]
    .split('#')[0]
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();
  const rootPage = normalizedName.split('/')[0];
  return rootPage === 'study' ? 'schedule' : rootPage;
}

export function requestPageNavigation(pageName) {
  document.dispatchEvent(new CustomEvent('navigation:show', {
    detail: pageName,
  }));
}

export class PageNavigation {
  #getRole;
  #activatePage;

  constructor({ getRole, activatePage }) {
    this.#getRole = getRole;
    this.#activatePage = activatePage;

    registerActionTarget('navigation', this);
    document.addEventListener('navigation:show', (event) => {
      this.show(event.detail);
    });
  }

  start() {
    globalThis.addEventListener('popstate', () => {
      this.show(this.resolveCurrentPage(), false);
    });

    globalThis.addEventListener('hashchange', () => {
      this.show(this.resolveCurrentPage(), false);
    });
  }

  resolveCurrentPage() {
    const pathPage = normalizePageName(globalThis.location.pathname);
    if (this.#canOpen(pathPage)) {
      return pathPage;
    }

    const hashPage = normalizePageName(globalThis.location.hash.replace(/^#/, ''));

    if (this.#canOpen(hashPage)) {
      return hashPage;
    }

    return DEFAULT_PAGE_BY_ROLE[this.#getRole()] || DEFAULT_PAGE_BY_ROLE.user;
  }

  async show(pageName, updateUrl = true) {
    const targetPage = normalizePageName(pageName);

    if (!this.#canOpen(targetPage)) {
      return;
    }

    if (updateUrl) {
      const targetUrl = `/${targetPage}`;
      if (globalThis.location.pathname !== targetUrl) {
        globalThis.history.pushState(null, '', targetUrl);
      }
    }

    document.querySelectorAll("[id^='page-']").forEach((page) => {
      page.classList.add('hidden');
    });

    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.remove('bg-gray-700', 'text-white');
      item.classList.add('text-gray-400');
    });

    document.getElementById(`page-${targetPage}`)?.classList.remove('hidden');

    if (targetPage === 'schedule') {
      document.getElementById('page-study')?.classList.remove('hidden');
    }

    const navItem = document.getElementById(`nav-${targetPage}`);
    navItem?.classList.add('bg-gray-700', 'text-white');
    navItem?.classList.remove('text-gray-400');

    await this.#activatePage(targetPage);
  }

  #canOpen(pageName) {
    if (!DASHBOARD_PAGES.has(pageName)) {
      return false;
    }

    return !ADMIN_PAGES.has(pageName) || this.#getRole() === 'admin';
  }
}
