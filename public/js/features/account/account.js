import { changePassword } from '../../api/session.js';
import { registerActionTarget } from '../../app/events.js';

export class AccountFeature {
  constructor() {
    registerActionTarget('account', this);
  }

  async changePassword() {
    const password = document.getElementById('new-password')?.value;
    const message = document.getElementById('pw-msg');
    if (!message) {
      return;
    }

    const result = await changePassword(password);
    message.className = `mt-2 text-sm ${result.ok ? 'text-green-400' : 'text-red-400'}`;
    message.textContent = result.ok
      ? '✓ Đã cập nhật mật khẩu!'
      : `✗ ${result.error || 'Failed'}`;
    message.classList.remove('hidden');
  }
}
