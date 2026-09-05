import { defineStore } from 'pinia';
import { getMe, login as apiLogin, logout as apiLogout } from '@/api/session';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: true,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
    isAdmin: (state) => Boolean(state.user && state.user.role === 'admin'),
    username: (state) => (state.user && state.user.username ? state.user.username : ''),
    userInitial: (state) => (state.user && state.user.username ? state.user.username.charAt(0).toUpperCase() : '?'),
  },
  actions: {
    async fetchUser() {
      this.loading = true;
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          this.user = null;
          return null;
        }
        const res = await getMe();
        if (res && res.username) {
          this.user = res;
        } else {
          this.user = null;
        }
      } catch (err) {
        this.user = null;
      } finally {
        this.loading = false;
        this.initialized = true;
      }
      return this.user;
    },
    async login(username, password) {
      const res = await apiLogin(username, password);
      if (res && res.token) {
        localStorage.setItem('auth_token', res.token);
      }
      if (res && res.username) {
        this.user = res;
      } else {
        await this.fetchUser();
      }
      return this.user;
    },
    async logout() {
      try {
        await apiLogout();
      } catch (_) {}
      localStorage.removeItem('auth_token');
      this.user = null;
      window.location.href = '/login';
    },
  },
});
