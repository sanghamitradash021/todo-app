export const API_URL = import.meta.env['VITE_API_URL'] as string ?? 'http://localhost:3001';

export const TODO_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  ALL: 'all',
} as const;

export const TODO_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  TODOS: '/todos',
} as const;
