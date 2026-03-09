import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

vi.mock('../hooks/useDashboardStats', () => ({
  useDashboardStats: vi.fn(() => ({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    completionPct: 0,
    priorityCounts: { high: 0, medium: 0, low: 0 },
    isStatsLoading: true,
  })),
}));

describe('DashboardPage', () => {
  function renderPage() {
    return render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
  }

  it('renders stats loading skeleton', () => {
    renderPage();
    expect(screen.getByLabelText('Loading stats')).toBeTruthy();
  });

  it('renders charts loading skeleton', () => {
    renderPage();
    expect(screen.getByLabelText('Loading charts')).toBeTruthy();
  });
});
