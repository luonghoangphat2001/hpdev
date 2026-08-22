import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? '/api' : 'https://api.hpdev.name.vn/api');

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Lỗi kết nối';
    return Promise.reject(new Error(message));
  }
);
