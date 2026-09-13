import { createRouter, createWebHistory } from 'vue-router';
import { routes } from './routes';
import { setupGuards } from './guards';

export * from './constants';
export * from './routes';
export * from './guards';

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

setupGuards(router);

export default router;
