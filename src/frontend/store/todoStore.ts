import { create } from 'zustand';
import type { Todo, TodoStatus, TodoPriority } from '../types';

export interface TodoFilters {
  status: TodoStatus;
  priority: TodoPriority | '';
}

interface TodoState {
  todos: Todo[];
  filters: TodoFilters;
  isLoading: boolean;
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  updateTodo: (todo: Todo) => void;
  removeTodo: (id: string) => void;
  setFilters: (filters: Partial<TodoFilters>) => void;
  setLoading: (loading: boolean) => void;
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],
  filters: { status: 'all', priority: '' },
  isLoading: false,

  setTodos: (todos) => set({ todos }),

  addTodo: (todo) => set((state) => ({ todos: [todo, ...state.todos] })),

  updateTodo: (todo) =>
    set((state) => ({
      todos: state.todos.map((t) => (t.id === todo.id ? todo : t)),
    })),

  removeTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id),
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  setLoading: (loading) => set({ isLoading: loading }),
}));
