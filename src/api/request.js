import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL;

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
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth_token');
    }
    let message = 'Lỗi kết nối';
    if (error.response && error.response.data && error.response.data.error) {
      message = error.response.data.error;
    }
    return Promise.reject(new Error(message));
  }
);
