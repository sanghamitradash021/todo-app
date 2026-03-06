export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  fields?: string[];
}

export type TodoStatus = 'pending' | 'completed' | 'all';
export type TodoPriority = 'low' | 'medium' | 'high';
