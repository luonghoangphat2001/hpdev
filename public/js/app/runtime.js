import { Application } from './application.js';

/**
 * Global MPA Application runtime.
 * Manages authentication, version guarding, page controller lifecycle and event delegation.
 */
export const application = new Application();

if (typeof window !== 'undefined') {
  application.init().catch((error) => {
    console.error('[Runtime] Application initialization failed:', error);
  });
}
