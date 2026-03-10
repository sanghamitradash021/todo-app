import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders the label', () => {
    render(<StatCard label="Total" value={5} accent="blue" index={0} />);
    expect(screen.getByText('Total')).toBeTruthy();
  });

  it('eventually displays the value after count-up', async () => {
    render(<StatCard label="Pending" value={3} accent="yellow" index={0} />);
    await waitFor(() => expect(screen.getByText('3')).toBeTruthy());
  });

  it('has aria-live="polite" on the number element', () => {
    render(<StatCard label="Total" value={0} accent="blue" index={0} />);
    const liveEl = screen.getByText('0');
    expect(liveEl.getAttribute('aria-live')).toBe('polite');
  });

  it('has aria-atomic="true" on the number element', () => {
    render(<StatCard label="Total" value={0} accent="blue" index={0} />);
    const liveEl = screen.getByText('0');
    expect(liveEl.getAttribute('aria-atomic')).toBe('true');
  });

  it('applies blue accent classes for blue variant', () => {
    const { container } = render(<StatCard label="Total" value={0} accent="blue" index={0} />);
    expect(container.firstChild?.toString()).toBeTruthy();
    expect(container.innerHTML).toContain('text-blue-600');
  });

  it('applies red accent classes for red variant', () => {
    const { container } = render(<StatCard label="Overdue" value={0} accent="red" index={0} />);
    expect(container.innerHTML).toContain('text-red-600');
  });

  it('renders value 0 without throwing', () => {
    render(<StatCard label="Completed" value={0} accent="green" index={0} />);
    expect(screen.getByText('Completed')).toBeTruthy();
  });
});
