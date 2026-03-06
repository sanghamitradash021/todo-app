import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import type { ApiSuccess } from '../types';

interface AuthResponseData {
  token: string;
  user: { id: string; email: string };
}

export interface UseAuthReturn {
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const storeLogin = useAuthStore((state) => state.login);
  const storeLogout = useAuthStore((state) => state.logout);

  const register = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post<ApiSuccess<AuthResponseData>>('/auth/register', {
        email,
        password,
      });
      storeLogin(data.data.token, data.data.user);
      navigate('/todos');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as { message?: string })?.message ?? 'Registration failed');
      } else {
        setError('Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post<ApiSuccess<AuthResponseData>>('/auth/login', {
        email,
        password,
      });
      storeLogin(data.data.token, data.data.user);
      navigate('/todos');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as { message?: string })?.message ?? 'Login failed');
      } else {
        setError('Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    storeLogout();
    navigate('/login');
  };

  return { register, login, logout, isLoading, error };
}
