import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TodoRepository } from '../../repositories/TodoRepository';
import type { TodoRow } from '../../types';

vi.mock('../../config/db', () => ({
  pool: { query: vi.fn() },
}));

import { pool } from '../../config/db';

const mockQuery = pool.query as ReturnType<typeof vi.fn>;

const baseTodo: TodoRow = {
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

describe('TodoRepository.findAllByUser', () => {
  it('returns all active todos for user when no filters applied', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [baseTodo] });

    const result = await TodoRepository.findAllByUser('user-uuid-1', {});

    expect(result).toEqual([baseTodo]);
    const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('user_id = $1');
    expect(sql).toContain('deleted_at IS NULL');
    expect(params).toEqual(['user-uuid-1']);
  });

  it('appends status filter when status is not "all"', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [baseTodo] });

    await TodoRepository.findAllByUser('user-uuid-1', { status: 'pending' });

    const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('status = $2');
    expect(params).toContain('pending');
  });

  it('does not append status filter when status is "all"', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [baseTodo] });

    await TodoRepository.findAllByUser('user-uuid-1', { status: 'all' });

    const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).not.toContain('status =');
    expect(params).not.toContain('all');
  });

  it('appends priority filter when priority provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [baseTodo] });

    await TodoRepository.findAllByUser('user-uuid-1', { priority: 'high' });

    const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('priority = $2');
    expect(params).toContain('high');
  });

  it('always includes deleted_at IS NULL in WHERE clause', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await TodoRepository.findAllByUser('user-uuid-1', {});

    const [sql] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('deleted_at IS NULL');
  });
});

describe('TodoRepository.findByIdAndUser', () => {
  it('returns null when no row matches', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await TodoRepository.findByIdAndUser('todo-uuid-1', 'user-uuid-1');

    expect(result).toBeNull();
  });

  it('returns the TodoRow when found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [baseTodo] });

    const result = await TodoRepository.findByIdAndUser('todo-uuid-1', 'user-uuid-1');

    expect(result).toEqual(baseTodo);
  });
});

describe('TodoRepository.create', () => {
  it('calls INSERT and returns the new row', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [baseTodo] });

    const result = await TodoRepository.create('user-uuid-1', {
      title: 'Test Todo',
    });

    expect(result).toEqual(baseTodo);
    const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT INTO todos');
    expect(sql).toContain('RETURNING');
    expect(params[0]).toBe('user-uuid-1');
    expect(params[1]).toBe('Test Todo');
  });

  it('defaults priority to "medium" when not provided', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [baseTodo] });

    await TodoRepository.create('user-uuid-1', { title: 'Test Todo' });

    const [, params] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(params[3]).toBe('medium');
  });
});

describe('TodoRepository.update', () => {
  it('returns the updated row when found', async () => {
    const updated = { ...baseTodo, title: 'Updated Title', updated_at: new Date() };
    mockQuery.mockResolvedValueOnce({ rows: [updated] });

    const result = await TodoRepository.update('todo-uuid-1', 'user-uuid-1', {
      title: 'Updated Title',
    });

    expect(result).toEqual(updated);
    const [sql] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('UPDATE todos');
    expect(sql).toContain('title = $1');
  });

  it('returns null when no rows were updated', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await TodoRepository.update('nonexistent', 'user-uuid-1', {
      title: 'Updated',
    });

    expect(result).toBeNull();
  });
});

describe('TodoRepository.toggleStatus', () => {
  it('returns the toggled row', async () => {
    const toggled = { ...baseTodo, status: 'completed' as const };
    mockQuery.mockResolvedValueOnce({ rows: [toggled] });

    const result = await TodoRepository.toggleStatus('todo-uuid-1', 'user-uuid-1');

    expect(result).toEqual(toggled);
    const [sql] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('CASE WHEN status');
    expect(sql).toContain('updated_at = NOW()');
  });

  it('returns null when todo not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const result = await TodoRepository.toggleStatus('nonexistent', 'user-uuid-1');

    expect(result).toBeNull();
  });
});

describe('TodoRepository.softDelete', () => {
  it('returns true when row was soft-deleted', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });

    const result = await TodoRepository.softDelete('todo-uuid-1', 'user-uuid-1');

    expect(result).toBe(true);
    const [sql] = mockQuery.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('deleted_at = NOW()');
  });

  it('returns false when no rows were updated', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0 });

    const result = await TodoRepository.softDelete('nonexistent', 'user-uuid-1');

    expect(result).toBe(false);
  });
});
