import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartsRow } from './ChartsRow';
import type { DashboardStats } from '../../hooks/useDashboardStats';

const loadedStats: DashboardStats = {
  total:          10,
  pending:        4,
  completed:      6,
  overdue:        1,
  completionPct:  60,
  priorityCounts: { high: 2, medium: 5, low: 3 },
  isStatsLoading: false,
};

const loadingStats: DashboardStats = { ...loadedStats, isStatsLoading: true };

describe('ChartsRow', () => {
  it('renders the completion rate section when loaded', () => {
    render(<ChartsRow stats={loadedStats} />);
    expect(screen.getByText('Completion Rate')).toBeTruthy();
  });

  it('renders the priority breakdown section when loaded', () => {
    render(<ChartsRow stats={loadedStats} />);
    expect(screen.getByText('Priority Breakdown')).toBeTruthy();
  });

  it('shows skeleton when isStatsLoading is true', () => {
    render(<ChartsRow stats={loadingStats} />);
    expect(screen.getByLabelText('Loading charts')).toBeTruthy();
  });

  it('does NOT show skeleton when loaded', () => {
    render(<ChartsRow stats={loadedStats} />);
    expect(screen.queryByLabelText('Loading charts')).toBeNull();
  });

  it('passes completionPct to the donut label', () => {
    render(<ChartsRow stats={loadedStats} />);
    expect(screen.getByText('60%')).toBeTruthy();
  });

  it('passes priorityCounts to the bars', () => {
    render(<ChartsRow stats={loadedStats} />);
    expect(screen.getByText('2 · 20%')).toBeTruthy(); // high: 2/10 = 20%
  });
});
