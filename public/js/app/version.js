const VERSION_STORAGE_KEY = 'dan_ai_app_version';
const HEALTH_CHECK_INTERVAL_MS = 30000;

let installed = false;
let reloadStarted = false;

// Invalidates a long-lived dashboard after the server deploys a new version.
export function installDeploymentVersionGuard() {
  if (installed) {
    return;
  }

  installed = true;

  const nativeFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (...args) => {
    const response = await nativeFetch(...args);
    const serverVersion = response.headers.get('X-App-Version');
    const currentVersion = localStorage.getItem(VERSION_STORAGE_KEY);

    if (serverVersion && !currentVersion) {
      localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
    } else if (serverVersion && currentVersion !== serverVersion && !reloadStarted) {
      reloadStarted = true;
      localStorage.setItem(VERSION_STORAGE_KEY, serverVersion);
      globalThis.alert('Hệ thống vừa cập nhật phiên bản mới. Vui lòng đăng nhập lại.');
      nativeFetch('/logout', {
        method: 'POST',
        credentials: 'same-origin',
      })
        .finally(() => globalThis.location.replace('/'));
    }

    return response;
  };

  globalThis.setInterval(() => {
    nativeFetch('/api/health', {
      cache: 'no-store',
    }).catch(() => {
      // The next interval retries after temporary connection failures.
    });
  }, HEALTH_CHECK_INTERVAL_MS);
}
