import { getCurrentUser } from '../api/session.js';
import { ModelSelector } from '../features/model-selector/modelSelector.js';
import { installDeploymentVersionGuard } from './version.js';
import { PageNavigation } from './navigation.js';
import { createPageRegistry } from './registry.js';
import { renderSession } from './session.js';
import { registerActionTarget } from './events.js';

export class Application {
  #role = 'user';
  #username = '';
  #controllers = new Map();
  #pageRegistry;
  #navigation;
  #modelSelector;
  #collapsed = false;

  constructor() {
    installDeploymentVersionGuard();
    const application = this;

    this.#pageRegistry = createPageRegistry({
      get username() {
        return application.#username;
      },
      get role() {
        return application.#role;
      },
      getActiveModel: () => this.#getActiveModel(),
      onModelChange: (model) => this.#handleModelChange(model),
      onPageCreated: (pageName, controller) => {
        this.#controllers.set(pageName, controller);
      },
    });

    this.#modelSelector = new ModelSelector({
      loadChat: () => this.#pageRegistry.load('chat'),
      getProviders: () => this.#controllers.get('config')?.providers,
    });

    this.#navigation = new PageNavigation({
      getRole: () => this.#role,
      activatePage: (pageName) => this.#pageRegistry.activate(pageName),
    });

    registerActionTarget('sidebar', {
      openMobile: () => this.openMobileSidebar(),
      closeMobile: () => this.closeMobileSidebar(),
      toggleCollapse: () => this.toggleSidebarCollapse(),
    });
  }

  async init() {
    const user = await getCurrentUser();
    if (!user) {
      globalThis.location.href = '/';
      return;
    }

    this.#role = user.role;
    this.#username = user.username;
    renderSession(user);
    this.#setupSidebar();

    const currentPage = this.#navigation.resolveCurrentPage();
    await this.#pageRegistry.activate(currentPage);
    this.#navigation.start();
  }

  openMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const mobileBackdrop = document.getElementById('sidebar-mobile-backdrop');
    sidebar?.classList.add('sidebar-mobile-open');
    mobileBackdrop?.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  closeMobileSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    const mobileBackdrop = document.getElementById('sidebar-mobile-backdrop');
    sidebar?.classList.remove('sidebar-mobile-open');
    mobileBackdrop?.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }

  toggleSidebarCollapse() {
    this.#collapsed = !this.#collapsed;
    this.#applySidebarCollapse(this.#collapsed);
    try {
      globalThis.localStorage?.setItem('dan-sidebar-collapsed', this.#collapsed ? '1' : '0');
    } catch (_) {}
  }

  #applySidebarCollapse(collapsed) {
    const sidebar = document.getElementById('app-sidebar');
    const toggle = document.getElementById('sidebar-collapse-btn');
    if (!sidebar || !toggle) return;

    sidebar.classList.toggle('sidebar-collapsed', collapsed);
    toggle.textContent = collapsed ? '»' : '«';
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar');
    toggle.title = collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar';
  }

  #setupSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;

    try {
      this.#collapsed = globalThis.localStorage?.getItem('dan-sidebar-collapsed') === '1';
    } catch (_) {}
    this.#applySidebarCollapse(this.#collapsed);

    const setupSidebarMenu = (elementId, storageKey, activePath) => {
      const menu = document.getElementById(elementId);
      if (!menu) return;
      let savedState = null;
      try {
        savedState = globalThis.localStorage?.getItem(storageKey) ?? null;
      } catch (_) {}
      menu.open = savedState === null
        ? globalThis.location.pathname.startsWith(activePath)
        : savedState === '1';
      menu.addEventListener('toggle', () => {
        try {
          globalThis.localStorage?.setItem(storageKey, menu.open ? '1' : '0');
        } catch (_) {}
      });
    };
    setupSidebarMenu('sidebar-learning-menu', 'dan-sidebar-learning-open', '/learning');
    setupSidebarMenu('sidebar-config-menu', 'dan-sidebar-config-open', '/config');

    // Auto-close mobile drawer when user navigates
    sidebar.querySelectorAll('a.nav-item').forEach((link) => {
      link.addEventListener('click', () => {
        if (globalThis.innerWidth < 768) {
          this.closeMobileSidebar();
        }
      });
    });

    document.addEventListener('navigation:show', () => {
      if (globalThis.innerWidth < 768) {
        this.closeMobileSidebar();
      }
    });
  }

  #getActiveModel() {
    return this.#controllers.get('config')?.activeModel
      ?? this.#controllers.get('chat')?.model;
  }

  #handleModelChange(model) {
    const chat = this.#controllers.get('chat');

    if (chat) {
      chat.model = model;
    }

    this.#modelSelector.render(model);
  }
}

