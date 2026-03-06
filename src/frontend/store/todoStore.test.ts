import { describe, it, expect, beforeEach } from 'vitest';
import { useTodoStore } from './todoStore';
import type { Todo } from '../types';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: 'todo-1',
  user_id: 'user-1',
  title: 'Test todo',
  description: null,
  status: 'pending',
  priority: 'medium',
  due_date: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

beforeEach(() => {
  useTodoStore.setState({ todos: [], filters: { status: 'all', priority: '' }, isLoading: false });
});

describe('todoStore.setTodos', () => {
  it('replaces the todos array', () => {
    const todos = [makeTodo({ id: '1' }), makeTodo({ id: '2' })];
    useTodoStore.getState().setTodos(todos);
    expect(useTodoStore.getState().todos).toEqual(todos);
  });
});

describe('todoStore.addTodo', () => {
  it('prepends new todo to the array', () => {
    const existing = makeTodo({ id: 'existing' });
    useTodoStore.setState({ todos: [existing] });
    const newTodo = makeTodo({ id: 'new' });
    useTodoStore.getState().addTodo(newTodo);
    expect(useTodoStore.getState().todos[0].id).toBe('new');
    expect(useTodoStore.getState().todos).toHaveLength(2);
  });
});

describe('todoStore.updateTodo', () => {
  it('replaces matching todo in-place', () => {
    const original = makeTodo({ id: '1', title: 'Original' });
    useTodoStore.setState({ todos: [original] });
    const updated = makeTodo({ id: '1', title: 'Updated' });
    useTodoStore.getState().updateTodo(updated);
    expect(useTodoStore.getState().todos[0].title).toBe('Updated');
    expect(useTodoStore.getState().todos).toHaveLength(1);
  });

  it('leaves other todos untouched', () => {
    const a = makeTodo({ id: 'a' });
    const b = makeTodo({ id: 'b' });
    useTodoStore.setState({ todos: [a, b] });
    useTodoStore.getState().updateTodo({ ...b, title: 'Changed' });
    expect(useTodoStore.getState().todos[0].id).toBe('a');
  });
});

describe('todoStore.removeTodo', () => {
  it('removes todo with matching id', () => {
    const a = makeTodo({ id: 'a' });
    const b = makeTodo({ id: 'b' });
    useTodoStore.setState({ todos: [a, b] });
    useTodoStore.getState().removeTodo('a');
    expect(useTodoStore.getState().todos).toHaveLength(1);
    expect(useTodoStore.getState().todos[0].id).toBe('b');
  });
});

describe('todoStore.setFilters', () => {
  it('merges partial filters', () => {
    useTodoStore.getState().setFilters({ status: 'pending' });
    expect(useTodoStore.getState().filters.status).toBe('pending');
    expect(useTodoStore.getState().filters.priority).toBe('');
  });

  it('updates priority independently', () => {
    useTodoStore.getState().setFilters({ priority: 'high' });
    expect(useTodoStore.getState().filters.status).toBe('all');
    expect(useTodoStore.getState().filters.priority).toBe('high');
  });
});

describe('todoStore.setLoading', () => {
  it('sets isLoading to true', () => {
    useTodoStore.getState().setLoading(true);
    expect(useTodoStore.getState().isLoading).toBe(true);
  });

  it('sets isLoading to false', () => {
    useTodoStore.setState({ isLoading: true });
    useTodoStore.getState().setLoading(false);
    expect(useTodoStore.getState().isLoading).toBe(false);
  });
});
