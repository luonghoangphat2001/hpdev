import { autoResize } from '../utils.js';

export class ChatPage {
  #api;
  #getUser;    // () => { initial: string }
  #model = 'gemini';

  constructor(api, getUser) {
    this.#api     = api;
    this.#getUser = getUser;
  }

  get model()      { return this.#model; }
  set model(value) { this.#model = value; }

  // ── Public ──────────────────────────────────────────────
  async send() {
    const input   = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    input.value      = '';
    input.style.height = 'auto';
    this.#appendMessage('user', message);

    const sendBtn    = document.getElementById('chat-send');
    sendBtn.disabled = true;

    const typing = this.#showTyping();

    try {
      const res  = await this.#api.chat(message, this.#model);
      typing.remove();
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        this.#appendMessage('assistant', data.response || ('❌ ' + (data.error || 'Unknown error')));
      } catch {
        this.#appendMessage('assistant', '❌ Server error: ' + text.substring(0, 200));
      }
    } catch (err) {
      typing.remove();
      this.#appendMessage('assistant', '❌ ' + err.message);
    }

    sendBtn.disabled = false;
    input.focus();
  }

  // ── Private ─────────────────────────────────────────────
  #appendMessage(role, text) {
    document.getElementById('chat-empty')?.remove();

    const wrap   = document.createElement('div');
    wrap.className = `flex gap-3 max-w-3xl mx-auto w-full ${role === 'user' ? 'flex-row-reverse' : ''}`;

    const avatar = document.createElement('div');
    if (role === 'user') {
      avatar.className  = 'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-1 bg-indigo-600';
      avatar.textContent = this.#getUser().initial;
    } else {
      avatar.className = 'shrink-0 w-7 h-7 rounded-full mt-1 overflow-hidden';
      avatar.innerHTML = '<img src="/images/dan.png" alt="Đần" class="w-full h-full object-cover" />';
    }

    const bubble = document.createElement('div');
    bubble.className  = `max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-800 text-gray-100 rounded-tl-sm'}`;
    bubble.textContent = text;

    wrap.appendChild(avatar);
    wrap.appendChild(bubble);
    const win = document.getElementById('chat-window');
    win.appendChild(wrap);
    win.scrollTop = 99999;
  }

  #showTyping() {
    const el = document.createElement('div');
    el.className = 'flex gap-3 max-w-3xl mx-auto w-full';
    el.innerHTML = `
      <div class="shrink-0 w-7 h-7 rounded-full mt-1 overflow-hidden"><img src="/images/dan.png" alt="Đần" class="w-full h-full object-cover" /></div>
      <div class="px-4 py-3 rounded-2xl bg-gray-800 text-gray-400 text-sm rounded-tl-sm">
        <span class="animate-pulse">⏳ Đần đang nghĩ...</span>
      </div>`;
    const win = document.getElementById('chat-window');
    win.appendChild(el);
    win.scrollTop = 99999;
    return el;
  }
}
