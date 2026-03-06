import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodos } from './useTodos';
import { useTodoStore } from '../store/todoStore';
import { useUiStore } from '../store/uiStore';
import type { Todo } from '../types';

vi.mock('../utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from '../utils/api';

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;
const mockPatch = api.patch as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

const baseTodo: Todo = {
  id: 'todo-1',
  user_id: 'user-1',
  title: 'Test',
  description: null,
  status: 'pending',
  priority: 'medium',
  due_date: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  useTodoStore.setState({ todos: [], filters: { status: 'all', priority: '' }, isLoading: false });
  useUiStore.setState({ toasts: [] });
});

describe('useTodos.fetchTodos', () => {
  it('calls setTodos with response data on success', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [baseTodo] } });
    const { result } = renderHook(() => useTodos());
    await act(() => result.current.fetchTodos());
    expect(useTodoStore.getState().todos).toEqual([baseTodo]);
  });

  it('shows error toast on failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useTodos());
    await act(() => result.current.fetchTodos());
    expect(useUiStore.getState().toasts[0].type).toBe('error');
  });

  it('clears loading state after fetch', async () => {
    mockGet.mockResolvedValueOnce({ data: { data: [] } });
    const { result } = renderHook(() => useTodos());
    await act(() => result.current.fetchTodos());
    expect(useTodoStore.getState().isLoading).toBe(false);
  });
});

describe('useTodos.createTodo', () => {
  it('calls addTodo and returns true on success', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: baseTodo } });
    const { result } = renderHook(() => useTodos());
    let success: boolean;
    await act(async () => { success = await result.current.createTodo({ title: 'Test' }); });
    expect(success!).toBe(true);
    expect(useTodoStore.getState().todos[0]).toEqual(baseTodo);
  });

  it('shows success toast on success', async () => {
    mockPost.mockResolvedValueOnce({ data: { data: baseTodo } });
    const { result } = renderHook(() => useTodos());
    await act(() => result.current.createTodo({ title: 'Test' }));
    expect(useUiStore.getState().toasts[0].type).toBe('success');
  });

  it('returns false and shows error toast on failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useTodos());
    let success: boolean;
    await act(async () => { success = await result.current.createTodo({ title: 'Test' }); });
    expect(success!).toBe(false);
    expect(useUiStore.getState().toasts[0].type).toBe('error');
  });
});

describe('useTodos.updateTodo', () => {
  it('calls updateTodo in store and returns true on success', async () => {
    const updated = { ...baseTodo, title: 'Updated' };
    mockPatch.mockResolvedValueOnce({ data: { data: updated } });
    useTodoStore.setState({ todos: [baseTodo] });
    const { result } = renderHook(() => useTodos());
    let success: boolean;
    await act(async () => { success = await result.current.updateTodo('todo-1', { title: 'Updated' }); });
    expect(success!).toBe(true);
    expect(useTodoStore.getState().todos[0].title).toBe('Updated');
  });

  it('returns false and shows error toast on failure', async () => {
    mockPatch.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useTodos());
    let success: boolean;
    await act(async () => { success = await result.current.updateTodo('todo-1', { title: 'X' }); });
    expect(success!).toBe(false);
    expect(useUiStore.getState().toasts[0].type).toBe('error');
  });
});

describe('useTodos.toggleTodo', () => {
  it('flips status optimistically before API resolves', async () => {
    useTodoStore.setState({ todos: [baseTodo] });
    let resolveToggle!: (value: unknown) => void;
    mockPatch.mockReturnValueOnce(new Promise((res) => { resolveToggle = res; }));
    const { result } = renderHook(() => useTodos());

    act(() => { void result.current.toggleTodo('todo-1'); });
    // Before API resolves, store should already be flipped
    expect(useTodoStore.getState().todos[0].status).toBe('completed');

    await act(async () => {
      resolveToggle({ data: { data: { ...baseTodo, status: 'completed' } } });
    });
  });

  it('reverts status to original on API error', async () => {
    useTodoStore.setState({ todos: [baseTodo] });
    mockPatch.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useTodos());
    await act(() => result.current.toggleTodo('todo-1'));
    expect(useTodoStore.getState().todos[0].status).toBe('pending');
    expect(useUiStore.getState().toasts[0].type).toBe('error');
  });
});

describe('useTodos.deleteTodo', () => {
  it('calls removeTodo and returns true on success', async () => {
    useTodoStore.setState({ todos: [baseTodo] });
    mockDelete.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTodos());
    let success: boolean;
    await act(async () => { success = await result.current.deleteTodo('todo-1'); });
    expect(success!).toBe(true);
    expect(useTodoStore.getState().todos).toHaveLength(0);
  });

  it('returns false and shows error toast on failure', async () => {
    mockDelete.mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useTodos());
    let success: boolean;
    await act(async () => { success = await result.current.deleteTodo('todo-1'); });
    expect(success!).toBe(false);
    expect(useUiStore.getState().toasts[0].type).toBe('error');
  });
});
