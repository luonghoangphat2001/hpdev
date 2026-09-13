import {
  ROUTE_NAMES,
  DEFAULT_TECH_STACK,
  TECH_STACKS,
  DEFAULT_QUIZ_MODE,
  QUIZ_MODES,
} from './constants';

export const resolveTechRedirect = (to) => {
  const requested = String(to.query.stack || '').toLowerCase();
  const targetStack = TECH_STACKS.has(requested) ? requested : DEFAULT_TECH_STACK;
  return { path: `/tech/${targetStack}`, query: to.query };
};

export const validateTechStackGuard = (to) => {
  const stack = String(to.params.stack || '').toLowerCase();
  return TECH_STACKS.has(stack) ? true : { path: `/tech/${DEFAULT_TECH_STACK}`, query: to.query };
};

export const resolveQuizRedirect = (to) => {
  const requested = String(to.query.mode || '').toLowerCase();
  const targetMode = QUIZ_MODES.has(requested) ? requested : DEFAULT_QUIZ_MODE;
  return { path: `/quiz/mode/${targetMode}`, query: to.query };
};

export const validateQuizModeGuard = (to) => {
  const mode = String(to.params.mode || '').toLowerCase();
  return QUIZ_MODES.has(mode) ? true : { path: `/quiz/mode/${DEFAULT_QUIZ_MODE}`, query: to.query };
};

export const routes = [
  // Root Redirect
  {
    path: '/',
    name: ROUTE_NAMES.ROOT,
    redirect: '/tech',
  },

  // Authentication
  {
    path: '/login',
    name: ROUTE_NAMES.LOGIN,
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true, title: 'Đăng nhập' },
  },

  // Tech Stacks
  {
    path: '/tech',
    redirect: resolveTechRedirect,
  },
  {
    path: '/tech/:stack',
    name: ROUTE_NAMES.TECH,
    component: () => import('@/views/learning/TechView.vue'),
    beforeEnter: validateTechStackGuard,
    meta: { requiresAuth: true, title: 'Kỹ thuật Lập trình' },
  },

  // English & Vocabulary Modules
  {
    path: '/english',
    redirect: '/vocab',
  },
  {
    path: '/vocab',
    name: ROUTE_NAMES.VOCAB,
    component: () => import('@/views/learning/VocabView.vue'),
    meta: { requiresAuth: true, title: 'Từ vựng & Flashcard' },
  },
  {
    path: '/discord',
    name: ROUTE_NAMES.DISCORD,
    component: () => import('@/views/learning/DiscordView.vue'),
    meta: { requiresAuth: true, title: 'Cấu hình Discord Bot' },
  },

  // Quizzes & Practice Exams
  {
    path: '/quiz',
    redirect: resolveQuizRedirect,
  },
  {
    path: '/quiz/mode/:mode',
    name: ROUTE_NAMES.QUIZ,
    component: () => import('@/views/learning/QuizView.vue'),
    beforeEnter: validateQuizModeGuard,
    meta: { requiresAuth: true, title: 'Trắc nghiệm & Luyện tập' },
  },
  {
    path: '/exam',
    name: ROUTE_NAMES.EXAM,
    component: () => import('@/views/learning/ExamView.vue'),
    meta: { requiresAuth: true, title: 'Thi thử Tiếng Anh' },
  },

  // English Skills
  {
    path: '/reading',
    name: ROUTE_NAMES.READING,
    component: () => import('@/views/learning/ReadingView.vue'),
    meta: { requiresAuth: true, title: 'Luyện Đọc hiểu' },
  },
  {
    path: '/writing',
    name: ROUTE_NAMES.WRITING,
    component: () => import('@/views/learning/WritingView.vue'),
    meta: { requiresAuth: true, title: 'Writing Studio' },
  },
  {
    path: '/speaking',
    name: ROUTE_NAMES.SPEAKING,
    component: () => import('@/views/learning/SpeakingView.vue'),
    meta: { requiresAuth: true, title: 'Luyện Nói Phản Xạ' },
  },
  {
    path: '/ielts',
    name: ROUTE_NAMES.IELTS,
    component: () => import('@/views/learning/IeltsView.vue'),
    meta: { requiresAuth: true, title: 'IELTS Preparation' },
  },

  // Catch-all Fallback
  {
    path: '/:pathMatch(.*)*',
    redirect: '/tech',
  },
];
