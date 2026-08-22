import { Application } from './app/application.js';

const application = new Application();
application.init().catch(() => {
  globalThis.location.href = '/';
});
