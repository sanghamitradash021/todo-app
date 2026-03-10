import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useTodoStore } from '../store/todoStore';
import { startOfToday } from '../utils/date';
import type { Todo, ApiSuccess } from '../types';

export interface DashboardStats {
  total:          number;
  pending:        number;
  completed:      number;
  overdue:        number;
  completionPct:  number;
  priorityCounts: { high: number; medium: number; low: number };
  isStatsLoading: boolean;
}

export function deriveStats(todos: Todo[]): Omit<DashboardStats, 'isStatsLoading'> {
  const total     = todos.length;
  const pending   = todos.filter((t) => t.status === 'pending').length;
  const completed = todos.filter((t) => t.status === 'completed').length;
  const today     = startOfToday();
  const overdue   = todos.filter(
    (t) => t.status === 'pending' && t.due_date !== null && new Date(t.due_date) < today,
  ).length;
  const completionPct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const priorityCounts = {
    high:   todos.filter((t) => t.priority === 'high').length,
    medium: todos.filter((t) => t.priority === 'medium').length,
    low:    todos.filter((t) => t.priority === 'low').length,
  };
  return { total, pending, completed, overdue, completionPct, priorityCounts };
}

/**
 * Fetches the full unfiltered todo list and derives dashboard statistics.
 * Re-fetches whenever todoStore.todos changes (any CRUD op triggers a refresh).
 */
export function useDashboardStats(): DashboardStats {
  // Used only as a change signal — any CRUD op replaces this reference
  const filteredTodos = useTodoStore((state) => state.todos);

  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async (): Promise<void> => {
      setIsStatsLoading(true);
      try {
        const { data } = await api.get<ApiSuccess<Todo[]>>('/todos');
        if (!cancelled) setAllTodos(data.data);
      } catch {
        // Silent — stale stats remain visible; no error toast (stats are secondary UI)
      } finally {
        if (!cancelled) setIsStatsLoading(false);
      }
    };

    void fetchAll();
    return () => { cancelled = true; };
  }, [filteredTodos]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...deriveStats(allTodos), isStatsLoading };
}
