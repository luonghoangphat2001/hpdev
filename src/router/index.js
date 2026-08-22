import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

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
    path: '/learning',
    name: 'learning',
    component: () => import('../views/LearningView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/learning/tech',
      },
      {
        path: 'tech',
        name: 'learning-tech',
        component: () => import('../views/LearningView.vue'),
      },
      {
        path: 'vocab',
        name: 'learning-vocab',
        component: () => import('../views/LearningView.vue'),
      },
      {
        path: 'quiz',
        name: 'learning-quiz',
        component: () => import('../views/LearningView.vue'),
      },
      {
        path: 'reading',
        name: 'learning-reading',
        component: () => import('../views/LearningView.vue'),
      },
      {
        path: 'writing',
        name: 'learning-writing',
        component: () => import('../views/LearningView.vue'),
      },
      {
        path: 'speaking',
        name: 'learning-speaking',
        component: () => import('../views/LearningView.vue'),
      },
    ],
  },
  {
    path: '/config',
    name: 'config',
    component: () => import('../views/ConfigView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
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
