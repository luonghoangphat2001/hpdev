import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/chat',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('../views/ChatView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/learning/:pathMatch(.*)*',
    name: 'learning-external',
    beforeEnter: (to) => {
      const pathMatch = Array.isArray(to.params.pathMatch)
        ? to.params.pathMatch.join('/')
        : to.params.pathMatch;
      const suffix = pathMatch ? `/${pathMatch}` : '/';
      window.location.replace(`https://learning.hpdev.name.vn${suffix}`);
      return false;
    },
  },
  {
    path: '/config/:tab(models|providers|openclaw|prompts|logs)?',
    name: 'config',
    component: () => import('../views/ConfigView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  { path: '/config/:pathMatch(.*)*', redirect: '/config/models' },

  {
    path: '/schedule',
    name: 'schedule',
    component: () => import('../views/ScheduleView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/study',
    redirect: '/schedule',
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('../views/UsersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('../views/HistoryView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/stats',
    name: 'stats',
    component: () => import('../views/StatsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/logs',
    name: 'logs',
    component: () => import('../views/LogsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/openclaw',
    name: 'openclaw',
    component: () => import('../views/OpenClawView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/chat',
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  if (!authStore.initialized) {
    await authStore.fetchUser();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' });
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'chat' });
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next({ name: 'chat' });
  }

  next();
});
