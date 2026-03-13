import { autoResize }  from './utils.js';
import { ApiClient }   from './api.js';
import { ChatPage }    from './pages/chat.js';
import { ConfigPage }  from './pages/config.js';
import { HistoryPage } from './pages/history.js';
import { StatsPage }   from './pages/stats.js';
import { UsersPage }   from './pages/users.js';

const ADMIN_PAGES = new Set(['config', 'history', 'stats', 'users']);

const MODEL_META = {
  gemini:  { icon: '🌟', label: 'Gemini 2.5 Flash' },
  claude:  { icon: '✳️',  label: 'Claude Sonnet' },
  chatgpt: { icon: '🤖', label: 'ChatGPT' },
};

class App {
  #api      = new ApiClient();
  #role     = 'user';
  #username = '';

  // Page controllers
  #chat;
  #config;
  #history;
  #stats;
  #users;

  async init() {
    const me = await this.#api.me();
    if (!me) { window.location.href = '/'; return; }
    this.#role     = me.role;
    this.#username = me.username;

    document.getElementById('user-name').textContent       = me.username;
    document.getElementById('user-role-label').textContent = me.role === 'admin' ? '🛡 Admin' : '👤 User';
    document.getElementById('user-avatar').textContent     = me.username.charAt(0).toUpperCase();

    // Wire up page controllers
    this.#chat    = new ChatPage(this.#api, () => ({ initial: me.username.charAt(0).toUpperCase() }));
    this.#history = new HistoryPage(this.#api);
    this.#stats   = new StatsPage(this.#api, () => this.#config?.activeModel ?? this.#chat.model);
    this.#users   = new UsersPage(this.#api, () => this.#username);
    this.#config  = new ConfigPage(this.#api, (model) => {
      this.#chat.model = model;
      this.#updateModelUI(model);
    });

    if (me.role === 'admin') {
      document.getElementById('admin-nav').classList.remove('hidden');
      await this.#config.load();
      this.showPage('config');
    } else {
      // Regular user: hide model selector, use server default
      document.getElementById('model-bar').classList.add('hidden');
      this.showPage('chat');
    }
    this.#exposeGlobals();
  }

  // ── Navigation ───────────────────────────────────────────
  showPage(name) {
    if (ADMIN_PAGES.has(name) && this.#role !== 'admin') return;

    document.querySelectorAll("[id^='page-']").forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.remove('bg-gray-700', 'text-white');
      b.classList.add('text-gray-400');
    });

    document.getElementById('page-' + name)?.classList.remove('hidden');
    const btn = document.getElementById('nav-' + name);
    if (btn) {
      btn.classList.add('bg-gray-700', 'text-white');
      btn.classList.remove('text-gray-400');
    }

    if (name === 'history') this.#history.load();
    if (name === 'stats')   this.#stats.load();
    if (name === 'users')   this.#users.load();
  }

  // ── Model dropdown ───────────────────────────────────────
  toggleModelDropdown() {
    const dd      = document.getElementById('model-dropdown');
    const overlay = document.getElementById('overlay');
    const open    = dd.classList.contains('hidden');
    dd.classList.toggle('hidden', !open);
    overlay.classList.toggle('hidden', !open);
  }

  closeModelDropdown() {
    document.getElementById('model-dropdown').classList.add('hidden');
    document.getElementById('overlay').classList.add('hidden');
  }

  setChatModel(model) {
    this.#chat.model = model;
    this.closeModelDropdown();
    this.#updateModelUI(model);
  }

  #updateModelUI(model) {
    const meta = MODEL_META[model] || MODEL_META.gemini;
    document.getElementById('model-icon').textContent    = meta.icon;
    document.getElementById('model-display').textContent = meta.label;
    ['gemini', 'claude', 'chatgpt'].forEach(m => {
      document.getElementById('check-' + m).classList.toggle('hidden', m !== model);
    });
  }

  // ── Password ─────────────────────────────────────────────
  async changePassword() {
    const password = document.getElementById('new-password').value;
    const msgEl    = document.getElementById('pw-msg');
    const data     = await this.#api.changePassword(password);
    msgEl.className  = 'mt-2 text-sm ' + (data.ok ? 'text-green-400' : 'text-red-400');
    msgEl.textContent = data.ok ? '✓ Đã cập nhật mật khẩu!' : '✗ ' + (data.error || 'Failed');
    msgEl.classList.remove('hidden');
  }

  // ── Expose globals for HTML inline handlers ──────────────
  #exposeGlobals() {
    window.showPage            = (n)  => this.showPage(n);
    window.toggleModelDropdown = ()   => this.toggleModelDropdown();
    window.closeModelDropdown  = ()   => this.closeModelDropdown();
    window.setChatModel        = (m)  => this.setChatModel(m);
    window.setDefaultModel     = (m)  => this.#config.setDefaultModel(m);
    window.saveConfig          = ()   => this.#config.save();
    window.sendChat            = ()   => this.#chat.send();
    window.loadHistory         = ()   => this.#history.load();
    window.loadStats           = ()   => this.#stats.load();
    window.loadUsers           = ()   => this.#users.load();
    window.addUser             = ()   => this.#users.add();
    window._deleteUser         = (u)  => this.#users.delete(u);
    window.changePassword      = ()   => this.changePassword();
    window.autoResize          = (el) => autoResize(el);
  }
}

const app = new App();
app.init().catch(() => { window.location.href = '/'; });
