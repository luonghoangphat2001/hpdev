import { startLoading, stopLoading } from '../app/loading.js';
import { apiCache, clearApiCache, invalidateApiCache } from '../cache/index.js';

export { clearApiCache, invalidateApiCache };

export async function request(url, options = {}) {
  startLoading();
  try {
    const response = await globalThis.fetch(url, {
      credentials: 'same-origin',
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const payload = await response.clone().json().catch(() => null);
      const error = new Error(payload?.error || `API request failed (${response.status})`);
      error.status = response.status;
      error.payload = payload;
      error.response = response;
      throw error;
    }

    return response;
  } finally {
    stopLoading();
  }
}

/**
 * Perform a JSON request with intelligent in-memory TTL caching and request collapsing.
 *
 * @param {string} url
 * @param {RequestInit & { cache?: boolean, forceRefresh?: boolean, bypassCache?: boolean, ttl?: number }} [options]
 * @returns {Promise<any>}
 */
export async function requestJson(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  if (!isGet) {
    apiCache.handleMutation(url);
    const response = await request(url, options);
    return response.json();
  }

  return apiCache.wrap(url, options, async () => {
    const response = await request(url, options);
    return response.json();
  });
}

export function sendJson(url, method, data) {
  return requestJson(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export function uploadFile(url, file, fields = {}) {
  const formData = new FormData();
  formData.append('file', file);

  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }

  return requestJson(url, {
    method: 'POST',
    body: formData,
  });
}
