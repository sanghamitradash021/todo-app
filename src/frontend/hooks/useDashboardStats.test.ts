import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deriveStats } from './useDashboardStats';
import type { Todo } from '../types';

// Fixed "today" so overdue tests are date-stable
const TODAY = new Date('2026-03-09T00:00:00.000Z');
const YESTERDAY = '2026-03-08'; // < today → overdue if pending
const TOMORROW  = '2026-03-10'; // > today → not overdue

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(TODAY);
});

afterEach(() => {
  vi.useRealTimers();
});

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    title: 'Test',
    description: null,
    status: 'pending',
    priority: 'medium',
    due_date: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('deriveStats', () => {
  it('returns all zeros for an empty list', () => {
    const s = deriveStats([]);
    expect(s.total).toBe(0);
    expect(s.pending).toBe(0);
    expect(s.completed).toBe(0);
    expect(s.overdue).toBe(0);
    expect(s.completionPct).toBe(0);
    expect(s.priorityCounts).toEqual({ high: 0, medium: 0, low: 0 });
  });

  it('counts total correctly', () => {
    const todos = [makeTodo(), makeTodo(), makeTodo()];
    expect(deriveStats(todos).total).toBe(3);
  });

  it('counts pending and completed correctly', () => {
    const todos = [
      makeTodo({ status: 'pending' }),
      makeTodo({ status: 'pending' }),
      makeTodo({ status: 'completed' }),
    ];
    const s = deriveStats(todos);
    expect(s.pending).toBe(2);
    expect(s.completed).toBe(1);
  });

  it('completionPct rounds correctly', () => {
    const todos = [
      makeTodo({ status: 'completed' }),
      makeTodo({ status: 'completed' }),
      makeTodo({ status: 'pending' }),
    ];
    expect(deriveStats(todos).completionPct).toBe(67); // Math.round(2/3 * 100)
  });

  it('completionPct is 0 when total is 0', () => {
    expect(deriveStats([]).completionPct).toBe(0);
  });

  it('completionPct is 100 when all completed', () => {
    const todos = [makeTodo({ status: 'completed' }), makeTodo({ status: 'completed' })];
    expect(deriveStats(todos).completionPct).toBe(100);
  });

  it('counts overdue: pending + due_date before today', () => {
    const todos = [makeTodo({ status: 'pending', due_date: YESTERDAY })];
    expect(deriveStats(todos).overdue).toBe(1);
  });

  it('does NOT count overdue when due_date is today', () => {
    const todos = [makeTodo({ status: 'pending', due_date: '2026-03-09' })];
    expect(deriveStats(todos).overdue).toBe(0);
  });

  it('does NOT count overdue when due_date is in the future', () => {
    const todos = [makeTodo({ status: 'pending', due_date: TOMORROW })];
    expect(deriveStats(todos).overdue).toBe(0);
  });

  it('does NOT count overdue when status is completed (even if past due)', () => {
    const todos = [makeTodo({ status: 'completed', due_date: YESTERDAY })];
    expect(deriveStats(todos).overdue).toBe(0);
  });

  it('does NOT count overdue when due_date is null', () => {
    const todos = [makeTodo({ status: 'pending', due_date: null })];
    expect(deriveStats(todos).overdue).toBe(0);
  });

  it('counts priority breakdown correctly', () => {
    const todos = [
      makeTodo({ priority: 'high' }),
      makeTodo({ priority: 'high' }),
      makeTodo({ priority: 'medium' }),
      makeTodo({ priority: 'low' }),
    ];
    expect(deriveStats(todos).priorityCounts).toEqual({ high: 2, medium: 1, low: 1 });
  });
});
