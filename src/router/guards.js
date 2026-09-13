import { useAuthStore } from '@/stores/auth';
import { ROUTE_NAMES, DEFAULT_TECH_STACK } from './constants';

/**
 * Setup authentication guard adhering to Vue Router 4 standards (return location, no next() callback).
 * @param {import('vue-router').Router} router
 */
export function setupAuthGuard(router) {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore();
    if (!authStore.initialized) {
      await authStore.fetchUser();
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      const redirectQuery = to.fullPath && to.fullPath !== '/' && to.fullPath !== '/login'
        ? { redirect: to.fullPath }
        : undefined;
      return { name: ROUTE_NAMES.LOGIN, query: redirectQuery };
    }

    if (to.meta.guestOnly && authStore.isAuthenticated) {
      return { name: ROUTE_NAMES.TECH, params: { stack: DEFAULT_TECH_STACK } };
    }
  });
}

/**
 * Setup document title guard to dynamically sync browser tab title with route meta.
 * @param {import('vue-router').Router} router
 */
export function setupTitleGuard(router) {
  router.afterEach((to) => {
    const title = to.meta?.title;
    document.title = title ? `${title} | Đần AI Learning` : 'Đần AI Learning Hub';
  });
}

/**
 * Setup all navigation guards on the router instance.
 * @param {import('vue-router').Router} router
 */
export function setupGuards(router) {
  setupAuthGuard(router);
  setupTitleGuard(router);
}
