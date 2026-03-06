import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TodoService } from '../../services/TodoService';
import type { TodoRow } from '../../types';

vi.mock('../../repositories/TodoRepository', () => ({
  TodoRepository: {
    findAllByUser: vi.fn(),
    findByIdAndUser: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleStatus: vi.fn(),
    softDelete: vi.fn(),
  },
}));

import { TodoRepository } from '../../repositories/TodoRepository';

const mockFindAll = TodoRepository.findAllByUser as ReturnType<typeof vi.fn>;
const mockFindById = TodoRepository.findByIdAndUser as ReturnType<typeof vi.fn>;
const mockCreate = TodoRepository.create as ReturnType<typeof vi.fn>;
const mockUpdate = TodoRepository.update as ReturnType<typeof vi.fn>;
const mockToggle = TodoRepository.toggleStatus as ReturnType<typeof vi.fn>;
const mockDelete = TodoRepository.softDelete as ReturnType<typeof vi.fn>;

const baseRow: TodoRow = {
  id: 'todo-uuid-1',
  user_id: 'user-uuid-1',
  title: 'Test Todo',
  description: null,
  status: 'pending',
  priority: 'medium',
  due_date: null,
  created_at: new Date('2024-01-01T00:00:00Z'),
  updated_at: new Date('2024-01-01T00:00:00Z'),
  deleted_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TodoService.listTodos', () => {
  it('returns formatted todos', async () => {
    mockFindAll.mockResolvedValueOnce([baseRow]);

    const result = await TodoService.listTodos('user-uuid-1', {});

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('todo-uuid-1');
    expect(result[0]).not.toHaveProperty('deleted_at');
  });

  it('formats due_date as YYYY-MM-DD string', async () => {
    const rowWithDate = { ...baseRow, due_date: new Date('2024-03-15T00:00:00Z') };
    mockFindAll.mockResolvedValueOnce([rowWithDate]);

    const result = await TodoService.listTodos('user-uuid-1', {});

    expect(result[0].due_date).toBe('2024-03-15');
  });

  it('returns null due_date when not set', async () => {
    mockFindAll.mockResolvedValueOnce([baseRow]);

    const result = await TodoService.listTodos('user-uuid-1', {});

    expect(result[0].due_date).toBeNull();
  });
});

describe('TodoService.getTodo', () => {
  it('returns formatted todo when found', async () => {
    mockFindById.mockResolvedValueOnce(baseRow);

    const result = await TodoService.getTodo('todo-uuid-1', 'user-uuid-1');

    expect(result.id).toBe('todo-uuid-1');
    expect(result.created_at).toBe('2024-01-01T00:00:00.000Z');
  });

  it('throws 404 AppError when not found', async () => {
    mockFindById.mockResolvedValueOnce(null);

    await expect(TodoService.getTodo('nonexistent', 'user-uuid-1')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'TODO_NOT_FOUND',
    });
  });
});

describe('TodoService.createTodo', () => {
  it('creates and returns formatted todo', async () => {
    mockCreate.mockResolvedValueOnce(baseRow);

    const result = await TodoService.createTodo('user-uuid-1', { title: 'Test Todo' });

    expect(result.id).toBe('todo-uuid-1');
    expect(result.title).toBe('Test Todo');
  });
});

describe('TodoService.updateTodo', () => {
  it('returns updated todo when found', async () => {
    const updated = { ...baseRow, title: 'Updated', updated_at: new Date('2024-01-02T00:00:00Z') };
    mockUpdate.mockResolvedValueOnce(updated);

    const result = await TodoService.updateTodo('todo-uuid-1', 'user-uuid-1', { title: 'Updated' });

    expect(result.title).toBe('Updated');
    expect(result.updated_at).toBe('2024-01-02T00:00:00.000Z');
  });

  it('throws 404 AppError when not found', async () => {
    mockUpdate.mockResolvedValueOnce(null);

    await expect(
      TodoService.updateTodo('nonexistent', 'user-uuid-1', { title: 'X' })
    ).rejects.toMatchObject({ statusCode: 404, errorCode: 'TODO_NOT_FOUND' });
  });
});

describe('TodoService.toggleTodo', () => {
  it('returns toggled todo', async () => {
    const toggled = { ...baseRow, status: 'completed' as const };
    mockToggle.mockResolvedValueOnce(toggled);

    const result = await TodoService.toggleTodo('todo-uuid-1', 'user-uuid-1');

    expect(result.status).toBe('completed');
  });

  it('throws 404 AppError when not found', async () => {
    mockToggle.mockResolvedValueOnce(null);

    await expect(TodoService.toggleTodo('nonexistent', 'user-uuid-1')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'TODO_NOT_FOUND',
    });
  });
});

describe('TodoService.deleteTodo', () => {
  it('resolves without error when deleted', async () => {
    mockDelete.mockResolvedValueOnce(true);

    await expect(TodoService.deleteTodo('todo-uuid-1', 'user-uuid-1')).resolves.toBeUndefined();
  });

  it('throws 404 AppError when not found', async () => {
    mockDelete.mockResolvedValueOnce(false);

    await expect(TodoService.deleteTodo('nonexistent', 'user-uuid-1')).rejects.toMatchObject({
      statusCode: 404,
      errorCode: 'TODO_NOT_FOUND',
    });
  });
});
