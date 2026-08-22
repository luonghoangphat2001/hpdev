import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    redirect: '/tech',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/tech',
    name: 'learning-tech',
    component: () => import('../views/LearningView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/vocab',
    name: 'learning-vocab',
    component: () => import('../views/LearningView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/quiz',
    name: 'learning-quiz',
    component: () => import('../views/LearningView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/writing',
    name: 'learning-writing',
    component: () => import('../views/LearningView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/speaking',
    name: 'learning-speaking',
    component: () => import('../views/LearningView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/tech',
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
    return next({ path: '/tech' });
  }

  next();
});
