import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TodosPage from './TodosPage';
import { useTodoStore } from '../store/todoStore';
import { useUiStore } from '../store/uiStore';
import type { Todo } from '../types';

vi.mock('../hooks/useTodos', () => ({
  useTodos: vi.fn(),
}));

import { useTodos } from '../hooks/useTodos';

const mockUseTodos = useTodos as ReturnType<typeof vi.fn>;

const baseTodo: Todo = {
  id: 'todo-1',
  user_id: 'user-1',
  title: 'Buy milk',
  description: null,
  status: 'pending',
  priority: 'medium',
  due_date: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

const defaultTodosHook = {
  todos: [],
  isLoading: false,
  filters: { status: 'all' as const, priority: '' as const },
  fetchTodos: vi.fn().mockResolvedValue(undefined),
  createTodo: vi.fn().mockResolvedValue(true),
  updateTodo: vi.fn().mockResolvedValue(true),
  toggleTodo: vi.fn().mockResolvedValue(undefined),
  deleteTodo: vi.fn().mockResolvedValue(true),
  setFilters: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  useTodoStore.setState({ todos: [], filters: { status: 'all', priority: '' }, isLoading: false });
  useUiStore.setState({ toasts: [] });
  mockUseTodos.mockReturnValue(defaultTodosHook);
});

function renderPage() {
  return render(
    <MemoryRouter>
      <TodosPage />
    </MemoryRouter>
  );
}

describe('TodosPage', () => {
  it('renders the page heading', () => {
    renderPage();
    expect(screen.getByText('My Todos')).toBeTruthy();
  });

  it('shows skeleton cards on initial load (isLoading true, never loaded before)', () => {
    mockUseTodos.mockReturnValue({ ...defaultTodosHook, isLoading: true });
    renderPage();
    expect(screen.getByLabelText('Loading todos')).toBeTruthy();
  });

  it('renders todo list when todos are present', () => {
    mockUseTodos.mockReturnValue({ ...defaultTodosHook, todos: [baseTodo] });
    renderPage();
    expect(screen.getByText('Buy milk')).toBeTruthy();
  });

  it('shows empty state when todos array is empty', () => {
    renderPage();
    expect(screen.getByText(/no todos yet/i)).toBeTruthy();
  });

  it('"Add Todo" button opens modal', async () => {
    renderPage();
    // Two "+ Add Todo" buttons exist: header bar + EmptyState — click the header one
    fireEvent.click(screen.getAllByText('+ Add Todo')[0]);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Add Todo' })).toBeTruthy());
  });

  it('filter change calls setFilters', () => {
    const setFilters = vi.fn();
    mockUseTodos.mockReturnValue({ ...defaultTodosHook, setFilters });
    renderPage();
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'pending' } });
    expect(setFilters).toHaveBeenCalledWith({ status: 'pending' });
  });
});
