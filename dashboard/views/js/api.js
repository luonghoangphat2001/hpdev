export class ApiClient {
  async me() {
    return fetch('/api/me').then(r => r.json());
  }

  async chat(message, model) {
    return fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message, model }),
    });
  }

  async getConfig() {
    return fetch('/api/config').then(r => r.json());
  }

  async saveConfig(data) {
    return fetch('/api/config', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
  }

  async getHistory(limit = 50) {
    return fetch(`/api/history?limit=${limit}`).then(r => r.json());
  }

  async getStats() {
    return fetch('/api/stats').then(r => r.json());
  }

  async getUsers() {
    return fetch('/api/users').then(r => r.json());
  }

  async addUser(username, password, role) {
    return fetch('/api/users', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password, role }),
    }).then(r => r.json());
  }

  async deleteUser(username) {
    return fetch(`/api/users/${encodeURIComponent(username)}`, { method: 'DELETE' })
      .then(r => r.json());
  }

  async changePassword(password) {
    return fetch('/api/password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    }).then(r => r.json());
  }
}
