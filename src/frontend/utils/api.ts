import axios from 'axios';
import { API_URL } from '../config/constants';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization header from in-memory store
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: 401 → clear auth state + redirect to login
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
