import axios from 'axios';

function resolveApiBase() {
  try {
    const url = import.meta.env.VITE_API_URL;
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      throw new Error('VITE_API_URL is required in environment');
    }
    return url.trim();
  } catch (error) {
    throw new Error(`[dan-manager] Failed to resolve API_BASE from env: ${error.message}`);
  }
}

export const API_BASE = resolveApiBase();

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('auth_token');
    }
    let message = 'Lỗi kết nối';
    if (error?.response?.data?.error) {
      message = error.response.data.error;
    }
    return Promise.reject(new Error(message));
  }
);
