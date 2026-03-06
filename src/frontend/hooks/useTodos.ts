import axios from 'axios';
import { api } from '../utils/api';
import { useTodoStore, type TodoFilters } from '../store/todoStore';
import { useUiStore } from '../store/uiStore';
import type { Todo, ApiSuccess } from '../types';

export interface CreateTodoData {
  title: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
}

export interface UpdateTodoData {
  title?: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string })?.message ?? fallback;
  }
  return fallback;
}

export function useTodos() {
  const { todos, filters, isLoading, setTodos, addTodo, updateTodo, removeTodo, setFilters, setLoading } =
    useTodoStore();
  const addToast = useUiStore((state) => state.addToast);

  const fetchTodos = async (): Promise<void> => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.status && filters.status !== 'all') params['status'] = filters.status;
      if (filters.priority) params['priority'] = filters.priority;
      const { data } = await api.get<ApiSuccess<Todo[]>>('/todos', { params });
      setTodos(data.data);
    } catch (err) {
      addToast('error', getErrorMessage(err, 'Failed to load todos'));
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async (todoData: CreateTodoData): Promise<boolean> => {
    try {
      const { data } = await api.post<ApiSuccess<Todo>>('/todos', todoData);
      addTodo(data.data);
      addToast('success', 'Todo created successfully');
      return true;
    } catch (err) {
      addToast('error', getErrorMessage(err, 'Failed to create todo'));
      return false;
    }
  };

  const updateTodoItem = async (id: string, todoData: UpdateTodoData): Promise<boolean> => {
    try {
      const { data } = await api.patch<ApiSuccess<Todo>>(`/todos/${id}`, todoData);
      updateTodo(data.data);
      addToast('success', 'Todo updated successfully');
      return true;
    } catch (err) {
      addToast('error', getErrorMessage(err, 'Failed to update todo'));
      return false;
    }
  };

  const toggleTodo = async (id: string): Promise<void> => {
    const original = todos.find((t) => t.id === id);
    if (!original) return;

    // Optimistic update
    updateTodo({ ...original, status: original.status === 'pending' ? 'completed' : 'pending' });

    try {
      const { data } = await api.patch<ApiSuccess<Todo>>(`/todos/${id}/toggle`);
      updateTodo(data.data);
    } catch (err) {
      // Revert on error
      updateTodo(original);
      addToast('error', getErrorMessage(err, 'Failed to toggle todo'));
    }
  };

  const deleteTodo = async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/todos/${id}`);
      removeTodo(id);
      addToast('success', 'Todo deleted successfully');
      return true;
    } catch (err) {
      addToast('error', getErrorMessage(err, 'Failed to delete todo'));
      return false;
    }
  };

  return {
    todos,
    isLoading,
    filters,
    fetchTodos,
    createTodo,
    updateTodo: updateTodoItem,
    toggleTodo,
    deleteTodo,
    setFilters: (f: Partial<TodoFilters>) => setFilters(f),
  };
}
