export function renderSession(user) {
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role-label');
  const userAvatar = document.getElementById('user-avatar');

  if (userName) {
    userName.textContent = user.username;
  }

  if (userRole) {
    userRole.textContent = user.role === 'admin' ? '🛡 Admin' : '👤 User';
  }

  if (userAvatar) {
    userAvatar.textContent = user.username.charAt(0).toUpperCase();
  }

  if (user.role === 'admin') {
    document.getElementById('admin-nav')?.classList.remove('hidden');
  } else {
    document.getElementById('model-bar')?.classList.add('hidden');
  }
}
