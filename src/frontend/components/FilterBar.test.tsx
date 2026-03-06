import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from './FilterBar';

const defaultFilters = { status: 'all' as const, priority: '' as const };

describe('FilterBar', () => {
  it('renders status and priority selects', () => {
    render(<FilterBar filters={defaultFilters} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Filter by status')).toBeTruthy();
    expect(screen.getByLabelText('Filter by priority')).toBeTruthy();
  });

  it('reflects current filter values', () => {
    render(<FilterBar filters={{ status: 'pending', priority: 'high' }} onChange={vi.fn()} />);
    expect((screen.getByLabelText('Filter by status') as HTMLSelectElement).value).toBe('pending');
    expect((screen.getByLabelText('Filter by priority') as HTMLSelectElement).value).toBe('high');
  });

  it('calls onChange with status partial when status changes', () => {
    const onChange = vi.fn();
    render(<FilterBar filters={defaultFilters} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'completed' } });
    expect(onChange).toHaveBeenCalledWith({ status: 'completed' });
  });

  it('calls onChange with priority partial when priority changes', () => {
    const onChange = vi.fn();
    render(<FilterBar filters={defaultFilters} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Filter by priority'), { target: { value: 'low' } });
    expect(onChange).toHaveBeenCalledWith({ priority: 'low' });
  });
});
