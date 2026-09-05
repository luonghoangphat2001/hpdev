import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const quizModes = new Set(['multiple_choice', 'spelling', 'leaderboard']);
const techStacks = new Set(['php', 'nextjs', 'python', 'reactjs', 'javascript', 'nodejs']);

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
    redirect: (to) => ({ path: `/tech/${techStacks.has(String(to.query.stack)) ? String(to.query.stack) : 'php'}`, query: {} }),
  },
  {
    path: '/tech/:stack',
    name: 'learning-tech',
    component: () => import('../views/learning/TechView.vue'),
    meta: { requiresAuth: true },
    beforeEnter: (to) => techStacks.has(String(to.params.stack)) ? true : '/tech/php',
  },
  {
    path: '/english',
    redirect: '/vocab',
  },
  {
    path: '/vocab',
    name: 'learning-vocab',
    component: () => import('../views/learning/VocabView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/discord',
    name: 'learning-discord',
    component: () => import('../views/learning/DiscordView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/quiz',
    redirect: (to) => ({ path: `/quiz/mode/${quizModes.has(String(to.query.mode)) ? String(to.query.mode) : 'multiple_choice'}`, query: {} }),
  },
  {
    path: '/quiz/mode/:mode',
    name: 'learning-quiz',
    component: () => import('../views/learning/QuizView.vue'),
    meta: { requiresAuth: true },
    beforeEnter: (to) => quizModes.has(String(to.params.mode)) ? true : '/quiz/mode/multiple_choice',
  },
  {
    path: '/exam',
    name: 'learning-exam',
    component: () => import('../views/learning/ExamView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/reading',
    name: 'learning-reading',
    component: () => import('../views/learning/ReadingView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/writing',
    name: 'learning-writing',
    component: () => import('../views/learning/WritingView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/speaking',
    name: 'learning-speaking',
    component: () => import('../views/learning/SpeakingView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/ielts',
    name: 'learning-ielts',
    component: () => import('../views/learning/IeltsView.vue'),
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
