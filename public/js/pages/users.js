import { escapeHtml } from '../utils.js';
import { encodeActionArgs } from '../app/events.js';
import { changePassword } from '../api/session.js';

export class UsersPage {
  #api;
  #getMe;
  #modalTargetUsername = null;

  constructor(api, getMe) {
    this.#api = api;
    this.#getMe = getMe;
  }

  async load() {
    const data = await this.#api.getUsers();
    const container = document.getElementById('user-list');
    const me = this.#getMe();

    const userBadge = document.getElementById('current-user-badge');
    if (userBadge) {
      userBadge.textContent = `Tài khoản: ${me || 'admin'}`;
    }

    const countBadge = document.getElementById('user-count-badge');
    if (countBadge) {
      countBadge.textContent = `${data?.length || 0} users`;
    }

    if (!data || data.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-sm py-4 text-center">Chưa có user nào trong hệ thống.</p>';
      return;
    }

    container.innerHTML = data
      .map((u) => {
        let lastActive = 'Chưa đăng nhập';
        if (u.last_active) {
          lastActive = this.#formatRelative(new Date(u.last_active));
        }

        const isOnline = u.last_active &&
          (Date.now() - new Date(u.last_active).getTime()) < 5 * 60 * 1000;
        const isAdmin = u.role === 'admin';
        const isSelf = u.username === me;

        const avatarBg = isAdmin
          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
          : 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40';

        const roleBadge = isAdmin
          ? 'bg-purple-900/60 text-purple-200 border border-purple-700/40'
          : 'bg-gray-600/60 text-gray-300';

        let selfBadgeHtml = '';
        if (isSelf) {
          selfBadgeHtml = '<span class="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">(bạn)</span>';
        }

        let onlineBadgeHtml = '';
        if (isOnline) {
          onlineBadgeHtml = '<span class="inline-flex items-center gap-1 text-[11px] text-green-400 font-medium"><span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Online</span>';
        }

        let deleteBtnHtml = '';
        if (!isSelf) {
          deleteBtnHtml = `
            <button data-action="users.delete" data-action-args="${encodeActionArgs(u.username)}"
              class="px-3 py-1.5 bg-red-900/30 hover:bg-red-800/60 text-red-300 rounded-lg text-xs font-medium border border-red-700/40 transition flex items-center gap-1">
              <span>🗑️</span> Xóa
            </button>`;
        }

        return `
          <div class="flex items-center justify-between p-3.5 bg-gray-700/40 hover:bg-gray-700/70 rounded-xl border border-gray-700/50 transition gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl ${avatarBg} flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                ${escapeHtml(u.username.charAt(0).toUpperCase())}
              </div>
              <div class="min-w-0">
                <div class="text-sm font-semibold flex items-center gap-2 text-gray-100">
                  <span class="truncate">${escapeHtml(u.username)}</span>
                  ${selfBadgeHtml}
                  ${onlineBadgeHtml}
                </div>
                <div class="text-xs text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  <span class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleBadge}">
                    ${u.role}
                  </span>
                  <span>·</span>
                  <span>Tạo: ${new Date(u.created_at).toLocaleDateString('vi-VN')}</span>
                  <span>·</span>
                  <span>Hoạt động: ${lastActive}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button data-action="users.openPasswordModal" data-action-args="${encodeActionArgs(u.username)}"
                class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-xs font-medium border border-gray-600 transition flex items-center gap-1">
                <span>🔑</span> Đổi MK
              </button>
              ${deleteBtnHtml}
            </div>
          </div>`;
      })
      .join('');
  }

  async changeMyPassword() {
    const password = document.getElementById('my-new-password')?.value;
    const confirmPassword = document.getElementById('my-confirm-password')?.value;
    const msgEl = document.getElementById('my-pw-msg');

    if (!password || password.length < 6) {
      this.#showMsg(msgEl, 'Mật khẩu mới phải có tối thiểu 6 ký tự!', false);
      return;
    }

    if (password !== confirmPassword) {
      this.#showMsg(msgEl, 'Xác nhận mật khẩu mới không khớp!', false);
      return;
    }

    try {
      const result = await changePassword(password);
      if (result.ok) {
        this.#showMsg(msgEl, '✓ Đã đổi mật khẩu tài khoản của bạn thành công!', true);
        const myPwInput = document.getElementById('my-new-password');
        if (myPwInput) {
          myPwInput.value = '';
        }
        const myConfirmInput = document.getElementById('my-confirm-password');
        if (myConfirmInput) {
          myConfirmInput.value = '';
        }
      } else {
        this.#showMsg(msgEl, '✗ ' + (result.error || 'Đổi mật khẩu thất bại'), false);
      }
    } catch (err) {
      this.#showMsg(msgEl, '✗ Lỗi kết nối: ' + err.message, false);
    }
  }

  openPasswordModal(username) {
    this.#modalTargetUsername = username;
    const titleEl = document.getElementById('modal-target-username');
    if (titleEl) {
      titleEl.textContent = username;
    }

    const input = document.getElementById('modal-new-password');
    if (input) {
      input.value = '';
    }

    const msgEl = document.getElementById('modal-pw-msg');
    if (msgEl) {
      msgEl.classList.add('hidden');
    }

    const modal = document.getElementById('edit-user-modal');
    if (modal) {
      modal.classList.remove('hidden');
      if (input) {
        input.focus();
      }
    }
  }

  closeModal() {
    this.#modalTargetUsername = null;
    const modal = document.getElementById('edit-user-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  async saveUserPassword() {
    if (!this.#modalTargetUsername) {
      return;
    }

    const password = document.getElementById('modal-new-password')?.value;
    const msgEl = document.getElementById('modal-pw-msg');

    if (!password || password.length < 6) {
      this.#showMsg(msgEl, 'Mật khẩu phải có tối thiểu 6 ký tự!', false);
      return;
    }

    try {
      const result = await this.#api.updateUserPassword(this.#modalTargetUsername, password);
      if (result.ok) {
        this.#showMsg(msgEl, `✓ Đã cập nhật mật khẩu cho user "${this.#modalTargetUsername}"!`, true);
        setTimeout(() => {
          this.closeModal();
          this.load();
        }, 1000);
      } else {
        this.#showMsg(msgEl, '✗ ' + (result.error || 'Cập nhật thất bại'), false);
      }
    } catch (err) {
      this.#showMsg(msgEl, '✗ Lỗi: ' + err.message, false);
    }
  }

  async add() {
    const username = document.getElementById('new-username')?.value.trim();
    const password = document.getElementById('new-user-password')?.value;
    const role = document.getElementById('new-user-role')?.value;
    const msgEl = document.getElementById('add-user-msg');

    if (!username || !password || password.length < 6) {
      this.#showMsg(msgEl, 'Vui lòng nhập đầy đủ Username và Password (tối thiểu 6 ký tự)', false);
      return;
    }

    try {
      const data = await this.#api.addUser(username, password, role);
      if (data.ok) {
        this.#showMsg(msgEl, `✓ Đã thêm user "${username}" thành công!`, true);
        const usernameInput = document.getElementById('new-username');
        if (usernameInput) {
          usernameInput.value = '';
        }
        const passwordInput = document.getElementById('new-user-password');
        if (passwordInput) {
          passwordInput.value = '';
        }
        await this.load();
      } else {
        this.#showMsg(msgEl, '✗ ' + (data.error || 'Thêm user thất bại'), false);
      }
    } catch (err) {
      this.#showMsg(msgEl, '✗ Lỗi: ' + err.message, false);
    }
  }

  async delete(username) {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}"?`)) {
      return;
    }

    try {
      const data = await this.#api.deleteUser(username);
      if (data.ok) {
        await this.load();
      } else {
        alert(data.error || 'Xóa user thất bại');
      }
    } catch (err) {
      alert('Lỗi khi xóa user: ' + err.message);
    }
  }

  // ── Private ─────────────────────────────────────────────
  #showMsg(el, text, isSuccess) {
    if (!el) {
      return;
    }

    el.className = `text-sm font-medium ${isSuccess ? 'text-green-400' : 'text-red-400'}`;
    el.textContent = text;
    el.classList.remove('hidden');
    setTimeout(() => {
      el.classList.add('hidden');
    }, 4000);
  }

  #formatRelative(date) {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60) {
      return 'vừa xong';
    }
    if (s < 3600) {
      return `${Math.floor(s / 60)} phút trước`;
    }
    if (s < 86400) {
      return `${Math.floor(s / 3600)} giờ trước`;
    }
    return `${Math.floor(s / 86400)} ngày trước`;
  }
}
