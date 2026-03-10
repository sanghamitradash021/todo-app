import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriorityBars } from './PriorityBars';

const defaultCounts = { high: 3, medium: 5, low: 2 };

describe('PriorityBars', () => {
  it('renders all three priority labels', () => {
    render(<PriorityBars priorityCounts={defaultCounts} total={10} />);
    expect(screen.getByText('High')).toBeTruthy();
    expect(screen.getByText('Medium')).toBeTruthy();
    expect(screen.getByText('Low')).toBeTruthy();
  });

  it('renders the section heading', () => {
    render(<PriorityBars priorityCounts={defaultCounts} total={10} />);
    expect(screen.getByText('Priority Breakdown')).toBeTruthy();
  });

  it('displays correct count for each priority', () => {
    render(<PriorityBars priorityCounts={defaultCounts} total={10} />);
    // Each row shows "{count} · {pct}%"
    expect(screen.getByText('3 · 30%')).toBeTruthy();
    expect(screen.getByText('5 · 50%')).toBeTruthy();
    expect(screen.getByText('2 · 20%')).toBeTruthy();
  });

  it('shows 0% for all priorities when total is 0 — AC-D03.6', () => {
    render(<PriorityBars priorityCounts={{ high: 0, medium: 0, low: 0 }} total={0} />);
    const zeros = screen.getAllByText('0 · 0%');
    expect(zeros.length).toBe(3);
  });

  it('rounds percentage correctly', () => {
    // 1/3 = 33.33% → 33%
    render(<PriorityBars priorityCounts={{ high: 1, medium: 1, low: 1 }} total={3} />);
    const thirtyThrees = screen.getAllByText('1 · 33%');
    expect(thirtyThrees.length).toBe(3);
  });

  it('handles a priority with count 0 (shows 0%)', () => {
    render(<PriorityBars priorityCounts={{ high: 0, medium: 5, low: 5 }} total={10} />);
    expect(screen.getByText('0 · 0%')).toBeTruthy();
  });
});
