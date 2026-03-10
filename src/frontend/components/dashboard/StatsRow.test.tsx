import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsRow } from './StatsRow';
import type { DashboardStats } from '../../hooks/useDashboardStats';

const loadedStats: DashboardStats = {
  total:          10,
  pending:        4,
  completed:      6,
  overdue:        2,
  completionPct:  60,
  priorityCounts: { high: 2, medium: 5, low: 3 },
  isStatsLoading: false,
};

const loadingStats: DashboardStats = {
  ...loadedStats,
  isStatsLoading: true,
};

describe('StatsRow', () => {
  it('renders all four card labels when loaded', () => {
    render(<StatsRow stats={loadedStats} />);
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('shows skeleton placeholders when isStatsLoading is true', () => {
    render(<StatsRow stats={loadingStats} />);
    expect(screen.getByLabelText('Loading stats')).toBeTruthy();
  });

  it('does NOT show skeleton when isStatsLoading is false', () => {
    render(<StatsRow stats={loadedStats} />);
    expect(screen.queryByLabelText('Loading stats')).toBeNull();
  });

  it('skeleton renders 4 placeholder cards', () => {
    render(<StatsRow stats={loadingStats} />);
    const container = screen.getByLabelText('Loading stats');
    expect(container.children.length).toBe(4);
  });
});
