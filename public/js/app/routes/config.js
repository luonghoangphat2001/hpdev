import { RoutePath } from './path.js';

const CONFIG_TABS = new Set(['models', 'providers', 'openclaw', 'prompts', 'logs']);

export class ConfigRoutes {
  parse(pathname = globalThis.location.pathname) {
    const path = new RoutePath(pathname);
    if (!path.isRoot('config')) return 'models';
    return this.normalizeTab(path.segment(1));
  }

  build(tab) {
    return `/config/${this.normalizeTab(tab)}`;
  }

  normalizeTab(tab) {
    return CONFIG_TABS.has(tab) ? tab : 'models';
  }
}

export const configRoutes = new ConfigRoutes();
